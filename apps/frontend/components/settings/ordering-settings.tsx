"use client";

import type { SettingsData } from "@mysagra/schemas";
import { InfoIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/setup/setup-field";
import { TimeZoneField } from "@/components/settings/general-settings";
import { useLocale } from "@/contexts/locale-context";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Ordering hours of the customer webapp, shared by the setup wizard and the settings page

type OrderingMode = SettingsData["ordering"]["mode"];

export type OrderingSettingsErrors = { closesAt?: string };

const ORDERING_MODES: OrderingMode[] = ["OPEN", "SCHEDULE", "CLOSED"];

// same rule as the backend schema
export function validateOrderingSettings(settings: SettingsData, t: Translations): OrderingSettingsErrors {
  const { opensAt, closesAt } = settings.ordering;
  return opensAt === closesAt ? { closesAt: t.setup.sameTimeError } : {};
}

// "Con orario · 18:30–01:00 (Europe/Rome)" and the like, for summaries
export function describeOrdering(settings: SettingsData, t: Translations): string {
  const { mode, opensAt, closesAt } = settings.ordering;
  if (mode === "OPEN") return t.setup.orderingModeOpen;
  if (mode === "CLOSED") return t.setup.orderingModeClosed;
  return `${t.setup.orderingModeSchedule} · ${opensAt}–${closesAt} (${settings.general.timezone})`;
}

export function OrderingControls({
  settings,
  errors,
  onChange,
  showTimeZone = true,
}: {
  settings: SettingsData;
  errors: OrderingSettingsErrors;
  onChange: (settings: SettingsData) => void;
  // the settings page edits the time zone in its own section
  showTimeZone?: boolean;
}) {
  const { t } = useLocale();
  const { ordering, general } = settings;

  const labels: Record<OrderingMode, string> = {
    OPEN: t.setup.orderingModeOpen,
    SCHEDULE: t.setup.orderingModeSchedule,
    CLOSED: t.setup.orderingModeClosed,
  };
  const hints: Record<OrderingMode, string> = {
    OPEN: t.setup.orderingOpenHint,
    SCHEDULE: t.setup.orderingScheduleHint,
    CLOSED: t.setup.orderingClosedHint,
  };


  function updateOrdering(patch: Partial<SettingsData["ordering"]>) {
    onChange({ ...settings, ordering: { ...ordering, ...patch } });
  }

  function setTimeZone(timezone: string) {
    onChange({ ...settings, general: { ...general, timezone } });
  }

  // "HH:mm" strings compare correctly as text
  const closesNextDay = ordering.closesAt < ordering.opensAt;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div role="radiogroup" aria-label={t.adminSettings.orderingSection} className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1">
          {ORDERING_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={ordering.mode === mode}
              onClick={() => updateOrdering({ mode })}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                ordering.mode === mode ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
              )}
            >
              {labels[mode]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{hints[ordering.mode]}</p>
        {ordering.mode !== "OPEN" && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <InfoIcon className="size-3.5 shrink-0 text-primary" />
            {t.setup.cashDeskNoLimits}
          </p>
        )}
      </div>

      {ordering.mode === "SCHEDULE" && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.setup.opensAtLabel} htmlFor="ordering-opens-at">
              <Input
                id="ordering-opens-at"
                type="time"
                className="h-10"
                value={ordering.opensAt}
                onChange={(e) => e.target.value && updateOrdering({ opensAt: e.target.value })}
              />
            </Field>
            <Field label={t.setup.closesAtLabel} htmlFor="ordering-closes-at" error={errors.closesAt}>
              <Input
                id="ordering-closes-at"
                type="time"
                className="h-10"
                value={ordering.closesAt}
                onChange={(e) => e.target.value && updateOrdering({ closesAt: e.target.value })}
                aria-invalid={!!errors.closesAt}
              />
            </Field>
          </div>
          {closesNextDay && !errors.closesAt && (
            <p className="text-xs text-muted-foreground">{t.setup.overnightHint.replace("{time}", ordering.closesAt)}</p>
          )}

          {showTimeZone && (
            <Field label={t.setup.timezoneLabel} htmlFor="ordering-timezone">
              <TimeZoneField id="ordering-timezone" value={general.timezone} onChange={setTimeZone} />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}
