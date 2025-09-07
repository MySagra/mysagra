"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { FoodStats } from "@/types/stats"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const chartConfig = {

} satisfies ChartConfig

interface FoodPieChartProps {
  stats: FoodStats
  className?: string
  totalFoods: number
}

export function FoodPieChart({ totalFoods, stats, className }: FoodPieChartProps) {

  const t = useTranslations('Analytics');

  function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  }

  const pieData = stats.foodOrdered.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    fill: getRandomColor(),
  }));



  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{t('foodsOrdered')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={pieData}
              dataKey="quantity"
              nameKey="food"
              innerRadius={60}
              strokeWidth={5}
            >
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalFoods.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {t('foods')}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
