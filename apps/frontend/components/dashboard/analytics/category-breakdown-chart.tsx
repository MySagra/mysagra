"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { LayoutGrid } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

interface CategoryBreakdownChartProps {
  categories: CategoryItem[];
  onCategoryClick?: (cat: CategoryItem) => void;
}

const CATEGORY_COLORS = [
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

export function CategoryBreakdownChart({ categories, onCategoryClick }: CategoryBreakdownChartProps) {
  const { t } = useLocale();

  const chartConfig: ChartConfig = categories.reduce((acc, cat, i) => {
    acc[cat.name] = {
      label: cat.name,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);

  const data = categories
    .filter((cat) => cat.revenue > 0)
    .map((cat, i) => ({
      name: cat.name,
      value: cat.revenue,
      quantity: cat.quantity,
      fill: CATEGORY_COLORS[categories.indexOf(cat) % CATEGORY_COLORS.length],
    }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-violet-600" />
          <CardTitle className="text-base">{t.analytics.categoryBreakdown}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {data.length > 0 && (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        {/* Category list */}
        <div className="mt-4 space-y-1.5 max-h-[180px] overflow-y-auto">
          {categories.map((cat, i) => {
            const pct = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : "0";
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryClick?.(cat)}
                className="flex items-center justify-between text-sm w-full rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="truncate max-w-[140px] group-hover:text-primary transition-colors">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="tabular-nums text-xs">{cat.quantity}x</span>
                  <span className="font-medium text-foreground tabular-nums text-xs">
                    {formatCurrency(cat.revenue)}
                  </span>
                  <span className="tabular-nums text-xs w-[40px] text-right">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
