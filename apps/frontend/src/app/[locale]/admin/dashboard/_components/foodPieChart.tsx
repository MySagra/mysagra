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
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useFoodsStats } from "@/hooks/api/stats"
import { Spinner } from "@/components/ui/spinner"

const chartConfig = {

} satisfies ChartConfig

interface FoodPieChartProps {
  className?: string
}

export function FoodPieChart({ className }: FoodPieChartProps) {
  const { data, isPending, isError } = useFoodsStats();
  const t = useTranslations('Analytics');

  if (isPending) {
    return <Spinner />
  }

  if (isError) {
    return <></>
  }

  function getRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  }

  const pieData = data.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    fill: getRandomColor(),
  }));

  const totalFoods = data.reduce((acc: number, curr: { quantity: string }) => acc + parseInt(curr.quantity), 0)

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
