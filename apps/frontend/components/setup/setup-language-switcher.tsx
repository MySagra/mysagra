"use client";

import { CheckIcon, LanguagesIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/contexts/locale-context";

const LOCALES: { value: Locale; flag: string }[] = [
  { value: "it", flag: "🇮🇹" },
  { value: "en", flag: "🇬🇧" },
];

export function SetupLanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const current = LOCALES.find((l) => l.value === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 px-3" aria-label={t.language.label}>
          <LanguagesIcon className="size-4" />
          <span>{current?.flag}</span>
          <span>{t.language[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        {LOCALES.map(({ value, flag }) => (
          <DropdownMenuItem key={value} onClick={() => setLocale(value)} className="gap-2">
            <span>{flag}</span>
            <span>{t.language[value]}</span>
            {locale === value && <CheckIcon className="ml-auto size-3.5 opacity-70" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
