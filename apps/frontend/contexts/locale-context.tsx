"use client";

import React, { createContext, useContext, useState } from "react";
import {
  Locale,
  Translations,
  translations,
  LOCALE_STORAGE_KEY,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(next: Locale) {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    // Write cookie so the server can read the preference on next request
    document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
