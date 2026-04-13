"use client";

import { useMemo } from "react";
import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Report } from "@mysagra/schemas/src/report.schema";
import type { DrillDownSelection } from "@/app/dashboard/analytics/page";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import { X, TrendingUp, Package } from "lucide-react";

interface ItemDrillDownProps {
  selection: NonNullable<DrillDownSelection>;
  reports: Report[];
  onClose: () => void;
}

function num(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (typeof v === "string") { const n = Number(v); return isNaN(n) ? 0 : n; }
  return 0;
}

export function ItemDrillDown({ selection, reports, onClose }: ItemDrillDownProps) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;

  // Extract time-series data for the selected item
  const timeSeriesData = useMemo(() => {
    return reports.map((report) => {
      const time = format(new Date(report.timestamp), "HH:mm dd/MM", { locale: dateLocale });
      let revenue = 0;
      let quantity = 0;

      if (selection.type === "category") {
        for (const cat of report.categoryStats) {
          if (cat.categoryId === selection.id) {
            revenue = num(cat.revenue);
            quantity = num(cat.quantity);
            break;
          }
        }
      } else {
        // food
        for (const cat of report.categoryStats) {
          for (const food of cat.foodStats) {
            if (food.foodId === selection.id) {
              revenue += num(food.revenue);
              quantity += num(food.quantity);
            }
          }
        }
      }

      return { time, revenue, quantity };
    });
  }, [reports, selection, dateLocale]);

  // Aggregated totals for this item
  const totals = useMemo(() => {
    const totalRevenue = timeSeriesData.reduce((sum, d) => sum + d.revenue, 0);
    const totalQuantity = timeSeriesData.reduce((sum, d) => sum + d.quantity, 0);
    return { totalRevenue, totalQuantity };
  }, [timeSeriesData]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);

  const revenueChartConfig: ChartConfig = {
    revenue: {
      label: t.analytics.revenue,
      color: "hsl(142, 76%, 36%)",
    },
  };

  const quantityChartConfig: ChartConfig = {
    quantity: {
      label: t.analytics.quantity,
      color: "hsl(217, 91%, 60%)",
    },
  };

  const typeLabel = selection.type === "food" ? t.analytics.drillDownFood : t.analytics.drillDownCategory;

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {selection.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {typeLabel} • {t.analytics.drillDownDetail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Summary badges */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5">
                <p className="text-xs text-muted-foreground">{t.analytics.revenue}</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.totalRevenue)}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 px-3 py-1.5">
                <p className="text-xs text-muted-foreground">{t.analytics.quantity}</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {totals.totalQuantity}x
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Mobile summary */}
        <div className="flex sm:hidden items-center gap-3 mb-4">
          <div className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-center">
            <p className="text-xs text-muted-foreground">{t.analytics.revenue}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totals.totalRevenue)}
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-blue-500/10 px-3 py-1.5 text-center">
            <p className="text-xs text-muted-foreground">{t.analytics.quantity}</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {totals.totalQuantity}x
            </p>
          </div>
        </div>

        {/* Charts in a grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Revenue over time */}
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {t.analytics.revenueOverTime}
            </p>
            <ChartContainer config={revenueChartConfig} className="h-[220px] w-full">
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="drillRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `€${v}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `€${Number(value).toFixed(2)}`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142, 76%, 36%)"
                  fill="url(#drillRevenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          {/* Quantity over time */}
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {t.analytics.quantityOverTime}
            </p>
            <ChartContainer config={quantityChartConfig} className="h-[220px] w-full">
              <BarChart data={timeSeriesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="drillQuantityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="quantity"
                  fill="url(#drillQuantityGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
