"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";

interface AvailabilityChipProps {
  available: boolean;
  /** Omit to render a static, non-interactive chip */
  onToggle?: () => void;
  pending?: boolean;
  className?: string;
}

/**
 * Chip di stato: il testo dice lo stato attuale, un tap lo inverte.
 * Più leggibile di uno switch durante il servizio.
 */
export function AvailabilityChip({ available, onToggle, pending, className }: AvailabilityChipProps) {
  const { t } = useLocale();
  const label = available ? t.menu.available : t.menu.unavailable;
  const classes = cn(
    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
    available
      ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : "border-destructive/25 bg-destructive/10 text-destructive",
    onToggle && "cursor-pointer hover:brightness-95 dark:hover:brightness-125 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
    pending && "opacity-60",
    className
  );
  const dot = (
    <span
      aria-hidden
      className={cn(
        "size-1.5 rounded-full",
        available ? "bg-emerald-500" : "bg-destructive",
        pending && "animate-pulse"
      )}
    />
  );

  if (!onToggle) {
    return (
      <span className={classes}>
        {dot}
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={pending}
      aria-pressed={available}
      title={t.menu.changeAvailability}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {dot}
      {label}
    </button>
  );
}

interface AvailabilitySegmentedProps {
  value: boolean;
  onChange: (available: boolean) => void;
  disabled?: boolean;
}

/** Controllo segmentato Disponibile / Non disponibile, usato nel form del piatto. */
export function AvailabilitySegmented({ value, onChange, disabled }: AvailabilitySegmentedProps) {
  const { t } = useLocale();
  const options = [
    { value: true, label: t.menu.available },
    { value: false, label: t.menu.unavailable },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t.menu.statusLabel}
      className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              !selected && "text-muted-foreground hover:text-foreground",
              selected && option.value && "bg-emerald-500/15 text-emerald-700 shadow-sm dark:text-emerald-400",
              selected && !option.value && "bg-destructive/15 text-destructive shadow-sm"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
