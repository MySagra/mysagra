"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useLocale } from "@/contexts/locale-context";
import { getReports } from "@/actions/reports";
import type { Report, GroupInterval } from "@mysagra/schemas/src/report.schema";
import { MainTimeChart } from "@/components/dashboard/analytics/main-time-chart";
import { CategoryBreakdownPie } from "@/components/dashboard/analytics/category-breakdown-pie";
import { AvgCompletionChart } from "@/components/dashboard/analytics/avg-completion-chart";
import { KpiCards } from "@/components/dashboard/analytics/kpi-cards";
import { AnalyticsFilters } from "@/components/dashboard/analytics/analytics-filters";
import { AnalyticsSidebar, type FilterSelection } from "@/components/dashboard/analytics/analytics-sidebar";
import { exportAnalyticsToExcel } from "@/lib/export-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// Safe number helper — ensures values are always numbers even if the API returns strings
function num(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") { const n = Number(v); return isNaN(n) ? 0 : n; }
  return 0;
}


export default function AnalyticsPage() {
  const { t } = useLocale();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSelection, setFilterSelection] = useState<FilterSelection>(null);

  // Default: today, from midnight to now
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateTo, setDateTo] = useState<Date>(() => new Date());
  const [groupBy, setGroupBy] = useState<GroupInterval>("1h");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports({
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        groupBy,
      });
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.analytics.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, groupBy, t.analytics.errorLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate aggregated stats (unfiltered, for the sidebar)
  const aggregatedStats = useMemo(() => {
    if (!reports.length) return null;

    const totalRevenue = reports.reduce((sum, r) => sum + num(r.totalRevenue), 0);
    const totalCashRevenue = reports.reduce((sum, r) => sum + num(r.totalCashRevenue), 0);
    const totalCardRevenue = reports.reduce((sum, r) => sum + num(r.totalCardRevenue), 0);
    const totalOrders = reports.reduce((sum, r) => sum + num(r.totalOrders), 0);
    const avgCompletionTimes = reports
      .filter((r) => r.averageCompletitionTime != null)
      .map((r) => num(r.averageCompletitionTime));
    const avgCompletionTime =
      avgCompletionTimes.length > 0
        ? avgCompletionTimes.reduce((a, b) => a + b, 0) / avgCompletionTimes.length
        : null;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Aggregate all food stats (with categoryId for filtering)
    const foodMap = new Map<string, { id: string; name: string; categoryName: string; categoryId: string; revenue: number; quantity: number }>();
    const categoryMap = new Map<string, { id: string; name: string; revenue: number; quantity: number }>();

    for (const report of reports) {
      for (const cat of report.categoryStats) {
        const existing = categoryMap.get(cat.categoryId);
        if (existing) {
          existing.revenue += num(cat.revenue);
          existing.quantity += num(cat.quantity);
        } else {
          categoryMap.set(cat.categoryId, {
            id: cat.categoryId,
            name: cat.categoryName,
            revenue: num(cat.revenue),
            quantity: num(cat.quantity),
          });
        }
        for (const food of cat.foodStats) {
          const existingFood = foodMap.get(food.foodId);
          if (existingFood) {
            existingFood.revenue += num(food.revenue);
            existingFood.quantity += num(food.quantity);
          } else {
            foodMap.set(food.foodId, {
              id: food.foodId,
              name: food.foodName,
              categoryName: cat.categoryName,
              categoryId: cat.categoryId,
              revenue: num(food.revenue),
              quantity: num(food.quantity),
            });
          }
        }
      }
    }

    const allFoods = Array.from(foodMap.values());

    const topFoods = allFoods
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topFoodsByRevenue = [...allFoods]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const categories = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    return {
      totalRevenue,
      totalCashRevenue,
      totalCardRevenue,
      totalOrders,
      avgCompletionTime,
      avgOrderValue,
      allFoods,
      topFoods,
      topFoodsByRevenue,
      categories,
    };
  }, [reports]);

  // Filtered reports based on selection (Power BI cross-filtering)
  const filteredReports = useMemo((): Report[] => {
    if (!filterSelection) return reports;

    return reports.map((report) => {
      if (filterSelection.type === "category") {
        const filteredCats = report.categoryStats.filter(
          (cat) => cat.categoryId === filterSelection.id
        );
        const totalRevenue = filteredCats.reduce((sum, c) => sum + num(c.revenue), 0);
        const totalOrders = filteredCats.reduce((sum, c) => sum + num(c.quantity), 0);

        return {
          ...report,
          totalRevenue,
          totalCashRevenue: 0,
          totalCardRevenue: 0,
          totalOrders,
          categoryStats: filteredCats,
        } as Report;
      } else {
        const filteredCats = report.categoryStats
          .map((cat) => {
            const filteredFoods = cat.foodStats.filter(
              (food) => food.foodId === filterSelection.id
            );
            if (filteredFoods.length === 0) return null;
            const revenue = filteredFoods.reduce((sum, f) => sum + num(f.revenue), 0);
            const quantity = filteredFoods.reduce((sum, f) => sum + num(f.quantity), 0);
            return { ...cat, foodStats: filteredFoods, revenue, quantity };
          })
          .filter(Boolean) as Report["categoryStats"];

        const totalRevenue = filteredCats.reduce((sum, c) => sum + num(c.revenue), 0);
        const totalOrders = filteredCats.reduce((sum, c) => sum + num(c.quantity), 0);

        return {
          ...report,
          totalRevenue,
          totalCashRevenue: 0,
          totalCardRevenue: 0,
          totalOrders,
          categoryStats: filteredCats,
        } as Report;
      }
    });
  }, [reports, filterSelection]);

  // Filtered KPI stats
  const filteredStats = useMemo(() => {
    if (!filterSelection || !aggregatedStats) return aggregatedStats;

    const totalRevenue = filteredReports.reduce((sum, r) => sum + num(r.totalRevenue), 0);
    const totalCashRevenue = filteredReports.reduce((sum, r) => sum + num(r.totalCashRevenue), 0);
    const totalCardRevenue = filteredReports.reduce((sum, r) => sum + num(r.totalCardRevenue), 0);
    const totalOrders = filteredReports.reduce((sum, r) => sum + num(r.totalOrders), 0);
    const avgCompletionTimes = filteredReports
      .filter((r) => r.averageCompletitionTime != null)
      .map((r) => num(r.averageCompletitionTime));
    const avgCompletionTime =
      avgCompletionTimes.length > 0
        ? avgCompletionTimes.reduce((a, b) => a + b, 0) / avgCompletionTimes.length
        : null;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      ...aggregatedStats,
      totalRevenue,
      totalCashRevenue,
      totalCardRevenue,
      totalOrders,
      avgCompletionTime,
      avgOrderValue,
    };
  }, [filterSelection, aggregatedStats, filteredReports]);

  const isFiltered = filterSelection !== null;

  return (
    <>
      <DashboardHeader title={t.analytics.title} />
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Filters */}
        <AnalyticsFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          groupBy={groupBy}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onGroupByChange={setGroupBy}
          onRefresh={fetchData}
          loading={loading}
          onExport={() => exportAnalyticsToExcel(reports, `report_${dateFrom.toISOString().slice(0,10)}_${dateTo.toISOString().slice(0,10)}`)}
          canExport={reports.length > 0 && !loading}
        />

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {/* KPI skeleton */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[90px] rounded-xl" />
              ))}
            </div>
            {/* Main area skeleton */}
            <div className="flex gap-6">
              <Skeleton className="hidden lg:block h-[600px] w-[320px] rounded-xl shrink-0" />
              <div className="flex-1 space-y-6">
                <Skeleton className="h-[380px] rounded-xl" />
                <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                  <Skeleton className="h-[340px] rounded-xl" />
                  <Skeleton className="h-[340px] rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ) : aggregatedStats && filteredStats ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <KpiCards stats={filteredStats} />

            {/* Main layout: Sidebar + Charts */}
            <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
              {/* Sidebar - matches charts height */}
              <div className="w-full lg:w-[320px] shrink-0">
                <AnalyticsSidebar
                  categories={aggregatedStats.categories}
                  topFoods={aggregatedStats.topFoods}
                  topFoodsByRevenue={aggregatedStats.topFoodsByRevenue}
                  selection={filterSelection}
                  onSelectionChange={setFilterSelection}
                />
              </div>

              {/* Charts area */}
              <div className="flex-1 min-w-0 space-y-6">
                {/* Unified main chart: Revenue / Orders / Payment breakdown */}
                <MainTimeChart
                  reports={filteredReports}
                  isFiltered={isFiltered}
                  filterName={filterSelection?.name}
                />

                {/* Category/Food Breakdown Pie + Avg Completion side by side */}
                <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                  <CategoryBreakdownPie
                    categories={aggregatedStats.categories}
                    foods={aggregatedStats.allFoods}
                    selection={filterSelection}
                  />
                  <AvgCompletionChart reports={filteredReports} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            {t.analytics.noData}
          </div>
        )}
      </div>
    </>
  );
}
