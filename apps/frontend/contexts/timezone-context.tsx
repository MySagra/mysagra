"use client";

import { useLocale } from "@/contexts/locale-context";
import type { Locale } from "@/lib/i18n";

const localeToTimezone: Record<Locale, string> = {
  it: "Europe/Rome",
  en: "Europe/Rome",
};

export function useTimezone(): string {
  const { locale } = useLocale();
  return localeToTimezone[locale];
}
