"use client";

import { useLocale } from "@/contexts/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
} from "lucide-react";

interface KpiCardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    avgCompletionTime: number | null;
  };
}

export function KpiCards({ stats }: KpiCardsProps) {
  const { t } = useLocale();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val);

  const formatTime = (ms: number | null) => {
    if (ms === null) return "—";
    const totalSeconds = Math.round(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const cards = [
    {
      title: t.analytics.kpiRevenue,
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      title: t.analytics.kpiOrders,
      value: stats.totalOrders.toLocaleString("it-IT"),
      icon: ShoppingBag,
      gradient: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      title: t.analytics.kpiAvgOrder,
      value: formatCurrency(stats.avgOrderValue),
      icon: TrendingUp,
      gradient: "from-amber-500/20 to-amber-600/5",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      title: t.analytics.kpiAvgCompletion,
      value: formatTime(stats.avgCompletionTime),
      icon: Clock,
      gradient: "from-violet-500/20 to-violet-600/5",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderColor: "border-violet-500/20",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={`relative overflow-hidden border ${card.borderColor} bg-gradient-to-br ${card.gradient} transition-all hover:shadow-lg`}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`rounded-xl p-2.5 bg-background/60 backdrop-blur-sm ${card.iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
