"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
import { useRevenueStats } from "@/hooks/api/stats"
import { Spinner } from "@/components/ui/spinner"

export const description = "A simple area chart"

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

interface RevenueAreaChartProps {
    className?: string
}

export function RevenueAreaChart({ className }: RevenueAreaChartProps) {
    const { data, isPending, isError } = useRevenueStats();
    const t = useTranslations('Analytics');

    if(isPending) {
        return <Spinner />
    }

    if(isError) {
        return <></>
    }

    return (
        <Card className={cn("flex flex-col", className)}>
            <CardHeader>
                <CardTitle>{t('revenuePerDay')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0 h-full min-h-0">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
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
                                    nameKey="revenue"
                                    formatter={(value) => `${value}€`}
                                />
                            }
                        />
                        <Area
                            dataKey="revenue"
                            type="natural"
                            fill="var(--color-revenue)"
                            fillOpacity={0.4}
                            stroke="var(--color-revenue)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
