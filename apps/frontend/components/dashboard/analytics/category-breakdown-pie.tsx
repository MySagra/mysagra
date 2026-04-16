"use client";

import { useMemo } from "react";
import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Label } from "recharts";
import { PieChart as PieChartIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterSelection } from "./analytics-sidebar";

interface CategoryBreakdownPieProps {
  categories: { id: string; name: string; revenue: number; quantity: number }[];
  foods: { id: string; name: string; categoryName: string; categoryId?: string; revenue: number; quantity: number }[];
  selection: FilterSelection;
}

const PIE_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(43, 74%, 66%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(27, 87%, 67%)",
  "hsl(173, 58%, 39%)",
  "hsl(12, 76%, 61%)",
  "hsl(197, 37%, 24%)",
  "hsl(47, 100%, 50%)",
];

export function CategoryBreakdownPie({ categories, foods, selection }: CategoryBreakdownPieProps) {
  const { t } = useLocale();

  const isShowingFoods = selection?.type === "category";

  // Build pie data: categories when no filter, foods when category is selected
  const { pieData, totalQuantity, chartTitle } = useMemo(() => {
    if (isShowingFoods && selection) {
      // Show foods within selected category
      const categoryFoods = foods.filter(
        (f) => f.categoryName === selection.name || f.categoryId === selection.id
      );
      const total = categoryFoods.reduce((sum, f) => sum + f.quantity, 0);
      return {
        pieData: categoryFoods
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 8)
          .map((f) => ({
            name: f.name,
            value: f.quantity,
            pct: total > 0 ? ((f.quantity / total) * 100).toFixed(1) : "0",
          })),
        totalQuantity: total,
        chartTitle: selection.name,
      };
    } else {
      // Show categories
      const total = categories.reduce((sum, c) => sum + c.quantity, 0);
      return {
        pieData: categories.map((c) => ({
          name: c.name,
          value: c.quantity,
          pct: total > 0 ? ((c.quantity / total) * 100).toFixed(1) : "0",
        })),
        totalQuantity: total,
        chartTitle: t.analytics.categoryBreakdown,
      };
    }
  }, [categories, foods, selection, isShowingFoods, t.analytics.categoryBreakdown]);

  const chartConfig: ChartConfig = pieData.reduce((cfg, item, i) => {
    cfg[item.name] = {
      label: item.name,
      color: PIE_COLORS[i % PIE_COLORS.length],
    };
    return cfg;
  }, {} as ChartConfig);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChartIcon className={cn("h-4 w-4", isShowingFoods ? "text-amber-500" : "text-violet-500")} />
          <CardTitle className="text-base">{chartTitle}</CardTitle>
          {isShowingFoods && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {t.analytics.sidebarFoods}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-2">
          {/* Legend - left side */}
          <div className="flex flex-col gap-1.5 shrink-0 min-w-[120px]">
            {pieData.slice(0, 10).map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="text-muted-foreground truncate max-w-[80px]">{item.name}</span>
                <span className="font-semibold ml-auto">{item.pct}%</span>
              </div>
            ))}
            {pieData.length > 10 && (
              <span className="text-[10px] text-muted-foreground pl-4">+{pieData.length - 10} altri</span>
            )}
          </div>
          {/* Chart - right side */}
          <ChartContainer config={chartConfig} className="h-[200px] flex-1 min-w-0">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => `${name}: ${value} ${t.analytics.orders.toLowerCase()}`}
                  />
                }
              />
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-lg font-bold"
                          >
                            {totalQuantity}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 18}
                            className="fill-muted-foreground text-[10px]"
                          >
                            {t.analytics.orders}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
