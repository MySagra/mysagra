"use client";

import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RefreshCw, FileSpreadsheet, Clock } from "lucide-react";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import type { GroupInterval } from "@mysagra/schemas/src/report.schema";
import { cn } from "@/lib/utils";

interface AnalyticsFiltersProps {
  dateFrom: Date;
  dateTo: Date | null; // null = "now"
  groupBy: GroupInterval;
  onDateFromChange: (d: Date) => void;
  onDateToChange: (d: Date | null) => void;
  onGroupByChange: (g: GroupInterval) => void;
  onRefresh: () => void;
  loading: boolean;
  onExport?: () => void;
  canExport?: boolean;
}

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: { hours: number; minutes: number };
  onChange: (hours: number, minutes: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-t border-border/40">
      <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      <input
        type="number"
        min={0}
        max={23}
        value={String(value.hours).padStart(2, "0")}
        onChange={(e) => {
          const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
          onChange(h, value.minutes);
        }}
        disabled={disabled}
        className="w-10 h-7 text-center text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
      />
      <span className="text-muted-foreground font-medium">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={String(value.minutes).padStart(2, "0")}
        onChange={(e) => {
          const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
          onChange(value.hours, m);
        }}
        disabled={disabled}
        className="w-10 h-7 text-center text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
      />
    </div>
  );
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
  onExport,
  canExport,
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

  const handleFromDateSelect = (d: Date | undefined) => {
    if (!d) return;
    // Preserve current time when selecting a new date
    d.setHours(dateFrom.getHours(), dateFrom.getMinutes(), 0, 0);
    onDateFromChange(d);
  };

  const handleFromTimeChange = (hours: number, minutes: number) => {
    const d = new Date(dateFrom);
    d.setHours(hours, minutes, 0, 0);
    onDateFromChange(d);
  };

  const handleToDateSelect = (d: Date | undefined) => {
    if (!d) return;
    // When selecting a "to" date, preserve current "to" time or use end-of-day
    if (dateTo) {
      d.setHours(dateTo.getHours(), dateTo.getMinutes(), 59, 999);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    onDateToChange(d);
  };

  const handleToTimeChange = (hours: number, minutes: number) => {
    const d = dateTo ? new Date(dateTo) : new Date();
    d.setHours(hours, minutes, 59, 999);
    onDateToChange(d);
  };

  // Quick presets
  const presets = [
    {
      label: t.analytics.presetToday,
      action: () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        onDateFromChange(start);
        onDateToChange(null); // now
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
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        onDateFromChange(start);
        onDateToChange(null); // now
        onGroupByChange("day");
      },
    },
    {
      label: t.analytics.presetMonth,
      action: () => {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        onDateFromChange(start);
        onDateToChange(null); // now
        onGroupByChange("day");
      },
    },
  ];

  const displayTo = dateTo ?? new Date();
  const isToNow = dateTo === null;

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
        {/* From date + time */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal min-w-[200px]",
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
              onSelect={handleFromDateSelect}
              locale={dateLocale}
            />
            <TimeInput
              value={{ hours: dateFrom.getHours(), minutes: dateFrom.getMinutes() }}
              onChange={handleFromTimeChange}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">→</span>

        {/* To date + time */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal min-w-[200px]",
                isToNow && "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isToNow
                ? t.analytics.now
                : format(displayTo, "PPP HH:mm", { locale: dateLocale })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={isToNow ? undefined : displayTo}
              onSelect={handleToDateSelect}
              locale={dateLocale}
            />
            <TimeInput
              value={{
                hours: isToNow ? new Date().getHours() : displayTo.getHours(),
                minutes: isToNow ? new Date().getMinutes() : displayTo.getMinutes(),
              }}
              onChange={handleToTimeChange}
              disabled={isToNow}
            />
            {/* "Now" toggle */}
            <div className="px-3 py-2 border-t border-border/40">
              <Button
                variant={isToNow ? "default" : "outline"}
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => onDateToChange(isToNow ? new Date() : null)}
              >
                {t.analytics.now}
              </Button>
            </div>
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

        {/* Export */}
        {onExport && (
          <Button
            size="sm"
            onClick={onExport}
            disabled={!canExport}
            className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t.analytics.exportExcel}
          </Button>
        )}
      </div>
    </div>
  );
}
