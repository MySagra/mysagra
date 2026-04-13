"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Report } from "@mysagra/schemas/src/report.schema";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import { ShoppingBag } from "lucide-react";

interface OrdersTimeChartProps {
  reports: Report[];
}

export function OrdersTimeChart({ reports }: OrdersTimeChartProps) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;

  const chartConfig: ChartConfig = {
    totalOrders: {
      label: t.analytics.orders,
      color: "hsl(217, 91%, 60%)",
    },
  };

  const data = reports.map((r) => ({
    time: format(new Date(r.timestamp), "HH:mm dd/MM", { locale: dateLocale }),
    totalOrders: r.totalOrders,
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base">{t.analytics.ordersOverTime}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
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
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="totalOrders"
              fill="url(#ordersGradient)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
