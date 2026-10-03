"use client";

import { useState } from "react";
import { it as itLocale } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { addDays, formatDateTime, formatEventRange, splitLocal } from "./customer-app-utils";

interface WhenPickerProps {
  id?: string;
  /** "YYYY-MM-DDTHH:mm" nel fuso della sagra, "" se non scelto */
  start: string;
  /** Solo con withEnd: fine dell'evento */
  end?: string;
  withEnd?: boolean;
  defaultStartTime: string;
  defaultEndTime?: string;
  placeholder: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (start: string, end: string) => void;
}

function toDay(date: string): Date | undefined {
  if (!date) return undefined;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fromDay(day: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/**
 * Giorno e ora in un unico campo. Con withEnd sceglie anche l'ora di fine:
 * se è prima dell'inizio, l'evento finisce il giorno dopo (es. 21:00–01:00).
 */
export function WhenPicker({
  id,
  start,
  end = "",
  withEnd,
  defaultStartTime,
  defaultEndTime = "",
  placeholder,
  invalid,
  disabled,
  onChange,
}: WhenPickerProps) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);

  const { date, time: startTime } = splitLocal(start);
  const endTime = splitLocal(end).time;
  const hasValue = !!date && (!withEnd || !!end);
  const overnight = withEnd && !!date && splitLocal(end).date === addDays(date, 1);

  function emit(nextDate: string, nextStart: string, nextEnd: string) {
    if (!nextDate || !nextStart) return;
    const startValue = `${nextDate}T${nextStart}`;
    if (!withEnd) {
      onChange(startValue, "");
      return;
    }
    if (!nextEnd) return;
    const endDate = nextEnd <= nextStart ? addDays(nextDate, 1) : nextDate;
    onChange(startValue, `${endDate}T${nextEnd}`);
  }

  const label = hasValue
    ? withEnd
      ? formatEventRange(start, end, locale)
      : formatDateTime(start, locale)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            "h-10 w-full justify-between px-3 font-normal",
            !hasValue && "text-muted-foreground"
          )}
        >
          <span className="truncate">{label}</span>
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={locale === "it" ? itLocale : undefined}
          selected={toDay(date)}
          defaultMonth={toDay(date)}
          onSelect={(day) => {
            if (!day) return;
            emit(fromDay(day), startTime || defaultStartTime, endTime || defaultEndTime);
          }}
          className="p-3 [--cell-size:--spacing(9)]"
        />
        <div className="space-y-2 border-t p-3">
          <div className={cn("grid gap-3", withEnd && "grid-cols-2")}>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-start`} className="text-xs">
                {withEnd ? t.customerApp.startLabel : t.customerApp.timeLabel}
              </Label>
              <Input
                id={`${id}-start`}
                type="time"
                step={300}
                disabled={!date}
                value={startTime}
                onChange={(e) => emit(date, e.target.value, endTime)}
                className="tabular-nums"
              />
            </div>
            {withEnd && (
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-end`} className="text-xs">
                  {t.customerApp.endLabel}
                </Label>
                <Input
                  id={`${id}-end`}
                  type="time"
                  step={300}
                  disabled={!date}
                  value={endTime}
                  onChange={(e) => emit(date, startTime, e.target.value)}
                  className="tabular-nums"
                />
              </div>
            )}
          </div>
          {!date && <p className="text-xs text-muted-foreground">{t.customerApp.pickDayFirst}</p>}
          {overnight && <p className="text-xs text-muted-foreground">{t.customerApp.endsNextDay}</p>}
          <Button type="button" size="sm" className="w-full" disabled={!hasValue} onClick={() => setOpen(false)}>
            {t.customerApp.done}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
