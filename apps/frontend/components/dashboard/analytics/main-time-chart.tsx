"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/contexts/locale-context";
import { useTimezone } from "@/contexts/timezone-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Report } from "@mysagra/schemas";
import { TrendingUp, ShoppingBag, Layers, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartMode = "revenue" | "orders" | "payment";

interface MainTimeChartProps {
  reports: Report[];
  isFiltered: boolean;
  filterName?: string;
  isCashRegisterFilter?: boolean;
}

export function MainTimeChart({ reports, isFiltered, filterName, isCashRegisterFilter }: MainTimeChartProps) {
  const { t } = useLocale();
  const timezone = useTimezone();
  const [mode, setMode] = useState<ChartMode>("revenue");

  // Payment breakdown is disabled for category/food filters, but allowed for cash register filters
  const paymentDisabled = isFiltered && !isCashRegisterFilter;

  // If a filter is active (non-cash-register) and user was on "payment" mode, switch back
  const effectiveMode = paymentDisabled && mode === "payment" ? "revenue" : mode;

  const data = useMemo(
    () =>
      reports.map((r) => {
        const date = new Date(r.timestamp);
        const dtf = new Intl.DateTimeFormat("it-IT", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        });
        const parts = dtf.formatToParts(date);
        const timeMap = new Map<string, string>();
        parts.forEach(p => timeMap.set(p.type, p.value));
        const timeStr = `${timeMap.get("hour")}:${timeMap.get("minute")} ${timeMap.get("day")}/${timeMap.get("month")}`;
        return {
          time: timeStr,
          totalRevenue: Number(r.totalRevenue) || 0,
          totalOrders: r.totalOrders,
          totalCashRevenue: Number(r.totalCashRevenue) || 0,
          totalCardRevenue: Number(r.totalCardRevenue) || 0,
        };
      }),
    [reports, timezone]
  );

  const revenueConfig: ChartConfig = {
    totalRevenue: {
      label: t.analytics.revenue,
      color: isFiltered ? "hsl(43, 74%, 66%)" : "hsl(142, 76%, 36%)",
    },
  };

  const ordersConfig: ChartConfig = {
    totalOrders: {
      label: t.analytics.orders,
      color: isFiltered ? "hsl(43, 74%, 66%)" : "hsl(217, 91%, 60%)",
    },
  };

  const paymentConfig: ChartConfig = {
    totalCashRevenue: {
      label: t.analytics.cash,
      color: "hsl(142, 76%, 36%)",
    },
    totalCardRevenue: {
      label: t.analytics.card,
      color: "hsl(217, 91%, 60%)",
    },
  };

  const revenueColor = isFiltered ? "hsl(43, 74%, 66%)" : "hsl(142, 76%, 36%)";
  const ordersColor = isFiltered ? "hsl(43, 74%, 66%)" : "hsl(217, 91%, 60%)";

  const tabs: { value: ChartMode; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { value: "revenue", label: t.analytics.revenue, icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: "orders", label: t.analytics.orders, icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    {
      value: "payment",
      label: t.analytics.revenueBreakdown,
      icon: <Layers className="h-3.5 w-3.5" />,
      disabled: paymentDisabled,
    },
  ];

  return (
    <Card className={cn("overflow-hidden transition-all", isFiltered && "ring-1 ring-amber-500/30 border-amber-500/20")}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            {effectiveMode === "revenue" && <TrendingUp className={cn("h-4 w-4", isFiltered ? "text-amber-500" : "text-emerald-600")} />}
            {effectiveMode === "orders" && <ShoppingBag className={cn("h-4 w-4", isFiltered ? "text-amber-500" : "text-blue-600")} />}
            {effectiveMode === "payment" && <Layers className="h-4 w-4 text-emerald-600" />}
            <CardTitle className="text-base">
              {effectiveMode === "revenue" && t.analytics.revenueOverTime}
              {effectiveMode === "orders" && t.analytics.ordersOverTime}
              {effectiveMode === "payment" && t.analytics.revenueBreakdown}
            </CardTitle>
            {isFiltered && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {filterName}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={effectiveMode === tab.value ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 text-xs px-2.5 gap-1.5",
                  tab.disabled && "opacity-40 cursor-not-allowed"
                )}
                onClick={() => !tab.disabled && setMode(tab.value)}
                disabled={tab.disabled}
                title={tab.disabled ? t.analytics.clearFilter : undefined}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Revenue Area Chart */}
        {effectiveMode === "revenue" && (
          <ChartContainer config={revenueConfig} className="h-75 w-full">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mainRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={revenueColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={revenueColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => `€${Number(value).toFixed(2)}`} />} />
              <Area type="monotone" dataKey="totalRevenue" stroke={revenueColor} fill="url(#mainRevenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}

        {/* Orders Bar Chart */}
        {effectiveMode === "orders" && (
          <ChartContainer config={ordersConfig} className="h-75 w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mainOrdersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ordersColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={ordersColor} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="totalOrders" fill="url(#mainOrdersGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}

        {/* Payment Breakdown Area Chart (cash vs card) */}
        {effectiveMode === "payment" && (
          <>
            <ChartContainer config={paymentConfig} className="h-65 w-full">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mainCashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="mainCardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `€${Number(value).toFixed(2)}`} />} />
                <Area type="monotone" dataKey="totalCashRevenue" stackId="1" stroke="hsl(142, 76%, 36%)" fill="url(#mainCashGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="totalCardRevenue" stackId="1" stroke="hsl(217, 91%, 60%)" fill="url(#mainCardGradient)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
            {/* Payment legend with colors and percentages */}
            {(() => {
              const totalCash = data.reduce((s, d) => s + d.totalCashRevenue, 0);
              const totalCard = data.reduce((s, d) => s + d.totalCardRevenue, 0);
              const total = totalCash + totalCard;
              const cashPct = total > 0 ? ((totalCash / total) * 100).toFixed(1) : "0";
              const cardPct = total > 0 ? ((totalCard / total) * 100).toFixed(1) : "0";
              const fmt = (v: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(v);
              return (
                <div className="flex items-center justify-center gap-6 mt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
                    <span className="text-muted-foreground">{t.analytics.cash}</span>
                    <span className="font-semibold">{fmt(totalCash)}</span>
                    <span className="text-muted-foreground text-xs">({cashPct}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(217, 91%, 60%)" }} />
                    <span className="text-muted-foreground">{t.analytics.card}</span>
                    <span className="font-semibold">{fmt(totalCard)}</span>
                    <span className="text-muted-foreground text-xs">({cardPct}%)</span>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </CardContent>
    </Card>
  );
}
