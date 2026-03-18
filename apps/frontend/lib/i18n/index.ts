import { en } from "./translations/en";
import { it } from "./translations/it";

export type Locale = "en" | "it";

// Recursive helper: convert all leaf string literal types to string
type Stringify<T> = T extends string
  ? string
  : { [K in keyof T]: Stringify<T[K]> };

export type Translations = Stringify<typeof en>;

export const translations: Record<Locale, Translations> = { en, it };

export const LOCALE_STORAGE_KEY = "mysagra-locale";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "it";

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (stored === "en" || stored === "it") return stored;

  const browserLang = navigator.language?.toLowerCase() ?? "";
  if (browserLang.startsWith("it")) return "it";

  return "en";
}

export { en, it };
