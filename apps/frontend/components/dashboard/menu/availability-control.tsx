"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { Switch } from "@/components/ui/switch";

interface AvailabilityToggleProps {
  available: boolean;
  /** Omit to render a static, non-interactive status chip */
  onToggle?: () => void;
  pending?: boolean;
  className?: string;
}

/**
 * Switch di disponibilità con lo stato scritto accanto: lo switch dice che si può
 * cambiare, il testo dice lo stato attuale. In sola lettura resta solo il chip di stato.
 */
export function AvailabilityToggle({ available, onToggle, pending, className }: AvailabilityToggleProps) {
  const { t } = useLocale();
  const label = available ? t.menu.available : t.menu.unavailable;

  if (!onToggle) {
    return (
      <span
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
          available
            ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-destructive/25 bg-destructive/10 text-destructive",
          className
        )}
      >
        <span aria-hidden className={cn("size-1.5 rounded-full", available ? "bg-emerald-500" : "bg-destructive")} />
        {label}
      </span>
    );
  }

  return (
    // la riga apre l'editor: il click sul controllo non deve arrivarci
    <label
      className={cn("inline-flex shrink-0 cursor-pointer items-center gap-2", pending && "opacity-60", className)}
      title={t.menu.changeAvailability}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* larghezza fissa: il testo cambia lunghezza, gli switch restano in colonna */}
      <span
        className={cn(
          "hidden w-24 text-right text-xs font-medium sm:block",
          available ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
        )}
      >
        {label}
      </span>
      <Switch
        checked={available}
        disabled={pending}
        onCheckedChange={() => onToggle()}
        aria-label={t.menu.changeAvailability}
        className="data-[state=checked]:bg-emerald-600"
      />
    </label>
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
