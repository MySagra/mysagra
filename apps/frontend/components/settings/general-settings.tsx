"use client";

import { useEffect, useMemo, useState } from "react";
import type { SettingsData } from "@mysagra/schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/contexts/locale-context";
import type { Locale } from "@/lib/i18n";

// General settings fields (time zone, currency), shared by the setup wizard and the settings page

// time zone of the browser, e.g. "Europe/Rome"
export function detectTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

type General = SettingsData["general"];

// One entry per area, like Windows does: the label shows the offset, the value stays a real
// IANA zone so daylight saving time is handled (a fixed "UTC+2" would be one hour off in winter).
const TIME_ZONES: { zone: string; cities: Record<Locale, string> }[] = [
  { zone: "Pacific/Honolulu", cities: { it: "Honolulu", en: "Honolulu" } },
  { zone: "America/Anchorage", cities: { it: "Anchorage", en: "Anchorage" } },
  { zone: "America/Los_Angeles", cities: { it: "Los Angeles, Vancouver", en: "Los Angeles, Vancouver" } },
  { zone: "America/Denver", cities: { it: "Denver", en: "Denver" } },
  { zone: "America/Chicago", cities: { it: "Chicago", en: "Chicago" } },
  { zone: "America/New_York", cities: { it: "New York, Toronto", en: "New York, Toronto" } },
  { zone: "America/Halifax", cities: { it: "Halifax", en: "Halifax" } },
  { zone: "America/Sao_Paulo", cities: { it: "San Paolo, Buenos Aires", en: "São Paulo, Buenos Aires" } },
  { zone: "Atlantic/Azores", cities: { it: "Azzorre", en: "Azores" } },
  { zone: "Etc/UTC", cities: { it: "Tempo coordinato universale", en: "Coordinated Universal Time" } },
  { zone: "Europe/London", cities: { it: "Londra, Dublino, Lisbona", en: "London, Dublin, Lisbon" } },
  { zone: "Europe/Rome", cities: { it: "Roma, Parigi, Berlino, Madrid", en: "Rome, Paris, Berlin, Madrid" } },
  { zone: "Europe/Athens", cities: { it: "Atene, Bucarest, Helsinki", en: "Athens, Bucharest, Helsinki" } },
  { zone: "Europe/Istanbul", cities: { it: "Istanbul, Mosca", en: "Istanbul, Moscow" } },
  { zone: "Asia/Dubai", cities: { it: "Dubai", en: "Dubai" } },
  { zone: "Asia/Karachi", cities: { it: "Karachi", en: "Karachi" } },
  { zone: "Asia/Kolkata", cities: { it: "Nuova Delhi, Mumbai", en: "New Delhi, Mumbai" } },
  { zone: "Asia/Bangkok", cities: { it: "Bangkok, Giacarta", en: "Bangkok, Jakarta" } },
  { zone: "Asia/Shanghai", cities: { it: "Pechino, Singapore", en: "Beijing, Singapore" } },
  { zone: "Asia/Tokyo", cities: { it: "Tokyo, Seul", en: "Tokyo, Seoul" } },
  { zone: "Australia/Sydney", cities: { it: "Sydney, Melbourne", en: "Sydney, Melbourne" } },
  { zone: "Pacific/Auckland", cities: { it: "Auckland", en: "Auckland" } },
];

// Currencies a sagra realistically uses; a saved one outside the list is still shown
const CURRENCIES = ["EUR", "CHF", "GBP", "USD", "CAD", "AUD", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN"];

// Standard (winter) offset, e.g. "UTC+01:00": stable all year, unlike the current one
function standardOffset(zone: string): string {
  const year = new Date().getFullYear();
  const minutes = [0, 6].map((month) => {
    const date = new Date(Date.UTC(year, month, 1));
    const local = new Date(date.toLocaleString("en-US", { timeZone: zone }));
    const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return Math.round((local.getTime() - utc.getTime()) / 60000);
  });
  const offset = Math.min(...minutes);
  const sign = offset < 0 ? "-" : "+";
  const abs = Math.abs(offset);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function timeZoneOptions(value: string, locale: Locale) {
  const options = TIME_ZONES.map(({ zone, cities }) => ({ value: zone, offset: standardOffset(zone), label: cities[locale] }));
  // the saved or detected zone may not be one of the representatives (e.g. Europe/Prague)
  if (!options.some((o) => o.value === value)) {
    const city = value.split("/").pop()?.replaceAll("_", " ") ?? value;
    options.push({ value, offset: standardOffset(value), label: city });
  }
  // west to east
  return options.sort((a, b) => offsetMinutes(a.offset) - offsetMinutes(b.offset));
}

function offsetMinutes(offset: string): number {
  const [, sign, h, m] = offset.match(/UTC([+-])(\d{2}):(\d{2})/) ?? [];
  return (sign === "-" ? -1 : 1) * (Number(h) * 60 + Number(m));
}

export function TimeZoneField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: General["timezone"];
  onChange: (timezone: string) => void;
}) {
  const { t, locale } = useLocale();

  const options = useMemo(() => timeZoneOptions(value, locale), [value, locale]);

  // read after mount: during server rendering it would be the server time zone
  const [deviceTimeZone, setDeviceTimeZone] = useState<string | null>(null);
  useEffect(() => setDeviceTimeZone(detectTimeZone()), []);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{option.offset}</span>
              <span className="truncate">{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t.setup.timezoneHint}</p>
        {deviceTimeZone && deviceTimeZone !== value && (
          <button
            type="button"
            onClick={() => onChange(deviceTimeZone)}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t.setup.useDeviceTimezone.replace("{tz}", deviceTimeZone)}
          </button>
        )}
      </div>
    </div>
  );
}

export function CurrencyField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: General["currency"];
  onChange: (currency: string) => void;
}) {
  const { t, locale } = useLocale();

  // "Euro" with "€" next to it, names in the panel language
  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "currency" });
    const codes = CURRENCIES.includes(value) ? CURRENCIES : [value, ...CURRENCIES];
    return codes.map((code) => {
      const symbol = new Intl.NumberFormat(locale, { style: "currency", currency: code })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value;
      return { value: code, label: names.of(code) ?? code, symbol: symbol && symbol !== code ? symbol : null };
    });
  }, [locale, value]);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{option.value}</span>
              <span className="truncate">{option.label}</span>
              {option.symbol && <span className="text-muted-foreground">{option.symbol}</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t.adminSettings.currencyHint}</p>
    </div>
  );
}
