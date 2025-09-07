"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { OrderStats } from "@/types/stats";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const chartConfig = {
    count: {
        label: "Orders",
        color: "var(--chart-1)",
    }
} satisfies ChartConfig

interface OrderBarChartProps {
    stats: OrderStats,
    className?: string
}

export default function OrderBarChart({ stats, className }: OrderBarChartProps) {

    const t = useTranslations('Analytics');

    function dateFormatter(value: string) {
        const date = new Date(value)

        return date.toLocaleDateString(t('time'), {
            month: "short",
            day: "numeric",
        })
    }

    return (
        <Card className={cn("flex flex-col", className)}>
            <CardHeader className="items-center pb-0">
                <CardTitle>{t('ordersPerDay')}</CardTitle>
                <CardDescription>
                    {
                        `
                        ${dateFormatter(stats?.ordersPerDay[0]?.day.toString() || "")} 
                        ${" - "}
                        ${dateFormatter(stats?.ordersPerDay[stats.ordersPerDay.length - 1]?.day.toString() || "")}`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0 h-full min-h-0">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <BarChart accessibilityLayer data={stats.ordersPerDay}>
                        <CartesianGrid vertical={false} />
                        <YAxis
                            dataKey="count"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString(t('time'), {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        const date = new Date(value)
                                        return date.toLocaleDateString(t('time'), {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                    nameKey="count"
                                />
                            }
                        />

                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}