"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Locale,
  Translations,
  translations,
  detectLocale,
  LOCALE_STORAGE_KEY,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("it");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  function setLocale(next: Locale) {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: translations[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
