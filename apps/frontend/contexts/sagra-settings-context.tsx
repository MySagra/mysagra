"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { SettingsData } from "@mysagra/schemas";
import { useLocale } from "@/contexts/locale-context";
import type { Locale } from "@/lib/i18n";

// Sagra settings for every dashboard page, loaded once by the dashboard layout
const SagraSettingsContext = createContext<SettingsData | null>(null);

export function SagraSettingsProvider({ settings, children }: { settings: SettingsData; children: React.ReactNode }) {
  return <SagraSettingsContext.Provider value={settings}>{children}</SagraSettingsContext.Provider>;
}

export function useSagraSettings(): SettingsData {
  const settings = useContext(SagraSettingsContext);
  if (!settings) throw new Error("useSagraSettings must be used inside SagraSettingsProvider");
  return settings;
}

// panel language -> Intl locale used for numbers and dates
export const INTL_LOCALE: Record<Locale, string> = {
  it: "it-IT",
  en: "en-GB",
};

// Formats an amount in the sagra currency, in the panel language: 12.5 -> "12,50 €".
// compact: no decimals, for chart axes (1200 -> "1200 €")
export function useCurrencyFormatter({ compact = false }: { compact?: boolean } = {}) {
  const { general } = useSagraSettings();
  const { locale } = useLocale();

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(INTL_LOCALE[locale], {
        style: "currency",
        currency: general.currency,
        ...(compact ? { maximumFractionDigits: 0 } : {}),
      }),
    [locale, general.currency, compact]
  );

  return useCallback((value: number | string) => formatter.format(Number(value) || 0), [formatter]);
}
