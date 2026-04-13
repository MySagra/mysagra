"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { UtensilsCrossed } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  categoryName: string;
  revenue: number;
  quantity: number;
}

interface TopFoodsChartProps {
  topFoods: FoodItem[];
  topFoodsByRevenue: FoodItem[];
  onFoodClick?: (food: FoodItem) => void;
}

const FOOD_COLORS = [
  "hsl(12, 76%, 61%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 24%)",
  "hsl(43, 74%, 66%)",
  "hsl(27, 87%, 67%)",
  "hsl(340, 82%, 52%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 76%, 36%)",
  "hsl(217, 91%, 60%)",
  "hsl(47, 100%, 50%)",
];

export function TopFoodsChart({ topFoods, topFoodsByRevenue, onFoodClick }: TopFoodsChartProps) {
  const { t } = useLocale();
  const [viewMode, setViewMode] = useState<"quantity" | "revenue">("quantity");

  const items = viewMode === "quantity" ? topFoods : topFoodsByRevenue;

  const chartConfig: ChartConfig = {
    value: {
      label: viewMode === "quantity" ? t.analytics.quantity : t.analytics.revenue,
      color: "hsl(142, 76%, 36%)",
    },
  };

  const data = items.map((food, i) => ({
    name: food.name.length > 18 ? food.name.substring(0, 18) + "…" : food.name,
    fullName: food.name,
    foodId: food.id,
    value: viewMode === "quantity" ? food.quantity : food.revenue,
    fill: FOOD_COLORS[i % FOOD_COLORS.length],
  }));

  const handleBarClick = (entry: any) => {
    if (!onFoodClick) return;
    const allItems = viewMode === "quantity" ? topFoods : topFoodsByRevenue;
    const food = allItems.find((f) => f.id === entry?.foodId);
    if (food) onFoodClick(food);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-orange-600" />
            <CardTitle className="text-base">{t.analytics.topFoods}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "quantity" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("quantity")}
            >
              {t.analytics.quantity}
            </Button>
            <Button
              variant={viewMode === "revenue" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("revenue")}
            >
              {t.analytics.revenue}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[340px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                viewMode === "revenue" ? `€${v}` : String(v)
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    viewMode === "revenue"
                      ? `€${Number(value).toFixed(2)}`
                      : `${value}`
                  }
                />
              }
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              className="cursor-pointer"
              onClick={(entry) => handleBarClick(entry)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="text-xs text-muted-foreground text-center mt-2 italic">
          {t.analytics.clickToExplore}
        </p>
      </CardContent>
    </Card>
  );
}
