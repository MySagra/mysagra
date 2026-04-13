"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Label } from "recharts";
import { CreditCard } from "lucide-react";

interface PaymentMethodChartProps {
  cashRevenue: number;
  cardRevenue: number;
}

const COLORS = ["hsl(142, 76%, 36%)", "hsl(217, 91%, 60%)"];

export function PaymentMethodChart({ cashRevenue, cardRevenue }: PaymentMethodChartProps) {
  const { t } = useLocale();

  const chartConfig: ChartConfig = {
    cash: {
      label: t.analytics.cash,
      color: COLORS[0],
    },
    card: {
      label: t.analytics.card,
      color: COLORS[1],
    },
  };

  const total = cashRevenue + cardRevenue;
  const cashPct = total > 0 ? ((cashRevenue / total) * 100).toFixed(1) : "0";
  const cardPct = total > 0 ? ((cardRevenue / total) * 100).toFixed(1) : "0";

  const data = [
    { name: "cash", value: cashRevenue, pct: cashPct },
    { name: "card", value: cardRevenue, pct: cardPct },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base">{t.analytics.paymentMethods}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
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
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
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
                          className="fill-foreground text-xl font-bold"
                        >
                          {formatCurrency(total)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          {t.analytics.total}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
            <span className="text-muted-foreground">{t.analytics.cash}</span>
            <span className="font-semibold">{cashPct}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
            <span className="text-muted-foreground">{t.analytics.card}</span>
            <span className="font-semibold">{cardPct}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
