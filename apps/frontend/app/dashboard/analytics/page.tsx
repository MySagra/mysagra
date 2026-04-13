"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useLocale } from "@/contexts/locale-context";
import { getReports } from "@/actions/reports";
import type { Report, GroupInterval } from "@mysagra/schemas/src/report.schema";
import { RevenueOverviewCard } from "@/components/dashboard/analytics/revenue-overview-card";
import { RevenueTimeChart } from "@/components/dashboard/analytics/revenue-time-chart";
import { PaymentMethodChart } from "@/components/dashboard/analytics/payment-method-chart";
import { TopFoodsChart } from "@/components/dashboard/analytics/top-foods-chart";
import { CategoryBreakdownChart } from "@/components/dashboard/analytics/category-breakdown-chart";
import { OrdersTimeChart } from "@/components/dashboard/analytics/orders-time-chart";
import { AvgCompletionChart } from "@/components/dashboard/analytics/avg-completion-chart";
import { CategoryRevenueTreemap } from "@/components/dashboard/analytics/category-revenue-treemap";
import { KpiCards } from "@/components/dashboard/analytics/kpi-cards";
import { AnalyticsFilters } from "@/components/dashboard/analytics/analytics-filters";
import { ItemDrillDown } from "@/components/dashboard/analytics/item-drill-down";
import { Skeleton } from "@/components/ui/skeleton";

// Safe number helper — ensures values are always numbers even if the API returns strings
function num(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") { const n = Number(v); return isNaN(n) ? 0 : n; }
  return 0;
}

export type DrillDownSelection = {
  type: "food" | "category";
  id: string;
  name: string;
} | null;

export default function AnalyticsPage() {
  const { t } = useLocale();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownSelection>(null);

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

  // Calculate aggregated stats with safe number coercion
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

    // Aggregate all food stats
    const foodMap = new Map<string, { id: string; name: string; categoryName: string; revenue: number; quantity: number }>();
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
              revenue: num(food.revenue),
              quantity: num(food.quantity),
            });
          }
        }
      }
    }

    const topFoods = Array.from(foodMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topFoodsByRevenue = Array.from(foodMap.values())
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
      topFoods,
      topFoodsByRevenue,
      categories,
    };
  }, [reports]);

  const handleDrillDown = useCallback((selection: DrillDownSelection) => {
    setDrillDown(selection);
  }, []);

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
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </div>
            {/* Chart skeletons */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Skeleton className="h-[350px] rounded-xl" />
              <Skeleton className="h-[350px] rounded-xl" />
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <Skeleton className="h-[400px] rounded-xl lg:col-span-2" />
              <Skeleton className="h-[400px] rounded-xl" />
            </div>
          </div>
        ) : aggregatedStats ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <KpiCards stats={aggregatedStats} />

            {/* Drill-down detail panel (shown when an item is selected) */}
            {drillDown && (
              <ItemDrillDown
                selection={drillDown}
                reports={reports}
                onClose={() => setDrillDown(null)}
              />
            )}

            {/* Revenue + Orders time series row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <RevenueTimeChart reports={reports} />
              <OrdersTimeChart reports={reports} />
            </div>

            {/* Revenue Overview + Payment Methods */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RevenueOverviewCard reports={reports} />
              </div>
              <PaymentMethodChart
                cashRevenue={aggregatedStats.totalCashRevenue}
                cardRevenue={aggregatedStats.totalCardRevenue}
              />
            </div>

            {/* Top Foods + Category Breakdown */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <TopFoodsChart
                topFoods={aggregatedStats.topFoods}
                topFoodsByRevenue={aggregatedStats.topFoodsByRevenue}
                onFoodClick={(food) =>
                  handleDrillDown({ type: "food", id: food.id, name: food.name })
                }
              />
              <CategoryBreakdownChart
                categories={aggregatedStats.categories}
                onCategoryClick={(cat) =>
                  handleDrillDown({ type: "category", id: cat.id, name: cat.name })
                }
              />
            </div>

            {/* Category Treemap + Avg Completion */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CategoryRevenueTreemap
                  categories={aggregatedStats.categories}
                  onCategoryClick={(cat) =>
                    handleDrillDown({ type: "category", id: cat.id, name: cat.name })
                  }
                />
              </div>
              <AvgCompletionChart reports={reports} />
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
