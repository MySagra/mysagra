"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Report } from "@mysagra/schemas/src/report.schema";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import { Clock } from "lucide-react";

interface AvgCompletionChartProps {
  reports: Report[];
}

export function AvgCompletionChart({ reports }: AvgCompletionChartProps) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;

  const chartConfig: ChartConfig = {
    avgTime: {
      label: t.analytics.avgCompletionTime,
      color: "hsl(262, 83%, 58%)",
    },
  };

  const data = reports
    .filter((r) => r.averageCompletitionTime != null)
    .map((r) => ({
      time: format(new Date(r.timestamp), "HH:mm dd/MM", { locale: dateLocale }),
      avgTime: Math.round((r.averageCompletitionTime ?? 0) / 60 * 10) / 10, // Convert to minutes
    }));

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-base">{t.analytics.avgCompletionTime}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
          {t.analytics.noCompletionData}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-violet-600" />
          <CardTitle className="text-base">{t.analytics.avgCompletionTime}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `${v}m`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value} min`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="hsl(262, 83%, 58%)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(262, 83%, 58%)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
