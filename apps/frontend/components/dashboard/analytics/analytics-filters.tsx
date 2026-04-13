"use client";

import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import type { GroupInterval } from "@mysagra/schemas/src/report.schema";
import { cn } from "@/lib/utils";

interface AnalyticsFiltersProps {
  dateFrom: Date;
  dateTo: Date;
  groupBy: GroupInterval;
  onDateFromChange: (d: Date) => void;
  onDateToChange: (d: Date) => void;
  onGroupByChange: (g: GroupInterval) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function AnalyticsFilters({
  dateFrom,
  dateTo,
  groupBy,
  onDateFromChange,
  onDateToChange,
  onGroupByChange,
  onRefresh,
  loading,
}: AnalyticsFiltersProps) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;

  const groupByOptions: { value: GroupInterval; label: string }[] = [
    { value: "1h", label: t.analytics.group1h },
    { value: "4h", label: t.analytics.group4h },
    { value: "12h", label: t.analytics.group12h },
    { value: "day", label: t.analytics.groupDay },
    { value: "all", label: t.analytics.groupAll },
  ];

  // Quick presets
  const presets = [
    {
      label: t.analytics.presetToday,
      action: () => {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        onDateFromChange(start);
        onDateToChange(now);
        onGroupByChange("1h");
      },
    },
    {
      label: t.analytics.presetYesterday,
      action: () => {
        const start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        onDateFromChange(start);
        onDateToChange(end);
        onGroupByChange("1h");
      },
    },
    {
      label: t.analytics.presetWeek,
      action: () => {
        const now = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        onDateFromChange(start);
        onDateToChange(now);
        onGroupByChange("day");
      },
    },
    {
      label: t.analytics.presetMonth,
      action: () => {
        const now = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        onDateFromChange(start);
        onDateToChange(now);
        onGroupByChange("day");
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={preset.action}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Date pickers and group by */}
      <div className="flex flex-wrap items-center gap-3">
        {/* From date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal min-w-[180px]",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateFrom, "PPP HH:mm", { locale: dateLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(d) => d && onDateFromChange(d)}
              locale={dateLocale}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">→</span>

        {/* To date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal min-w-[180px]",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateTo, "PPP HH:mm", { locale: dateLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(d) => d && onDateToChange(d)}
              locale={dateLocale}
            />
          </PopoverContent>
        </Popover>

        {/* Group by */}
        <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as GroupInterval)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="h-9 w-9"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}
