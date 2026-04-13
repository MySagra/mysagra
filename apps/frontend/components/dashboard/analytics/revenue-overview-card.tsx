"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Report } from "@mysagra/schemas/src/report.schema";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import { Layers } from "lucide-react";

interface RevenueOverviewCardProps {
  reports: Report[];
}

export function RevenueOverviewCard({ reports }: RevenueOverviewCardProps) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;

  const chartConfig: ChartConfig = {
    totalCashRevenue: {
      label: t.analytics.cashRevenue,
      color: "hsl(142, 76%, 36%)",
    },
    totalCardRevenue: {
      label: t.analytics.cardRevenue,
      color: "hsl(217, 91%, 60%)",
    },
  };

  const data = reports.map((r) => ({
    time: format(new Date(r.timestamp), "HH:mm dd/MM", { locale: dateLocale }),
    totalCashRevenue: Number(r.totalCashRevenue) || 0,
    totalCardRevenue: Number(r.totalCardRevenue) || 0,
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-base">{t.analytics.revenueBreakdown}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
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
              dataKey="totalCashRevenue"
              stackId="1"
              stroke="hsl(142, 76%, 36%)"
              fill="url(#cashGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="totalCardRevenue"
              stackId="1"
              stroke="hsl(217, 91%, 60%)"
              fill="url(#cardGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
