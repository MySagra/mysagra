import { Banner, Category } from "@/lib/api-types";
import type { Locale } from "@/lib/i18n";

export type CustomerAppTab = "banners" | "instructions";

export const DEFAULT_BANNER_COLOR = "fecc01";

export function bannerImageUrl(filename: string) {
  return `/api/images/banners/${filename}`;
}

/** Il titolo è il nome del banner; i banner vecchi possono avere solo l'etichetta. */
export function bannerName(banner: Pick<Banner, "title" | "label">) {
  return banner.title?.trim() || banner.label;
}

/** Categoria come la mostra il menù dei clienti (solo quelle disponibili). */
export interface PreviewCategory {
  id: string;
  name: string;
  imageUrl: string | null;
}

export function toPreviewCategories(categories: Category[]): PreviewCategory[] {
  return sortByPosition(categories.filter((c) => c.available)).map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image ? `/api/images/categories/${c.image}` : null,
  }));
}

export function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

// ── Date e fuso orario ───────────────────────────────────────────────
// I campi del form usano stringhe locali "YYYY-MM-DDTHH:mm" nel fuso della sagra.

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function toZonedInput(value: Date | string, timeZone: string): string {
  const p = zonedParts(new Date(value), timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function fromZonedInput(local: string, timeZone: string): Date {
  const [date, time = "00:00"] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const p = zonedParts(new Date(guess), timeZone);
  const offset =
    Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - guess;
  return new Date(guess - offset);
}

export function splitLocal(local: string): { date: string; time: string } {
  const [date = "", time = ""] = local.split("T");
  return { date, time };
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

function intlLocale(locale: Locale) {
  return locale === "it" ? "it-IT" : "en-GB";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Le stringhe locali sono già nel fuso della sagra: formattale come UTC per non spostarle. */
function localToDate(local: string) {
  const { date, time } = splitLocal(local);
  const [y, m, d] = date.split("-").map(Number);
  const [h = 0, min = 0] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, min));
}

function format(local: string, locale: Locale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).format(
    localToDate(local)
  );
}

/** "Sabato 3 ottobre, 21:00–23:00" */
export function formatEventRange(start: string, end: string, locale: Locale): string {
  const startTime = splitLocal(start).time;
  const endTime = splitLocal(end).time;
  const startDay = splitLocal(start).date;
  const endDay = splitLocal(end).date;
  const overnight = endDay === addDays(startDay, 1) && endTime <= startTime;
  if (startDay === endDay || overnight) {
    const day = capitalize(format(start, locale, { weekday: "long", day: "numeric", month: "long" }));
    return `${day}, ${startTime}–${endTime}`;
  }
  const short: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${format(start, locale, short)}, ${startTime} – ${format(end, locale, short)}, ${endTime}`;
}

/** "Sabato 3 ottobre, 21:00" */
export function formatDateTime(local: string, locale: Locale): string {
  const day = capitalize(format(local, locale, { weekday: "long", day: "numeric", month: "long" }));
  return `${day}, ${splitLocal(local).time}`;
}

/** "sab 3 ott, 21:00" */
export function formatShortDateTime(local: string, locale: Locale): string {
  const day = format(local, locale, { weekday: "short", day: "numeric", month: "short" });
  return `${day.replace(/\./g, "")}, ${splitLocal(local).time}`;
}

/** "3 ott" */
export function formatShortDate(local: string, locale: Locale): string {
  return format(local, locale, { day: "numeric", month: "short" }).replace(/\./g, "");
}

// ── Colori ───────────────────────────────────────────────────────────

export function normalizeHex(value: string | null | undefined): string {
  const hex = (value ?? "").replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : DEFAULT_BANNER_COLOR;
}

// ── Link ─────────────────────────────────────────────────────────────

/** "www.sagra.it" diventa "https://www.sagra.it". */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

// ── Markdown delle istruzioni (**grassetto**, *corsivo*, ~~barrato~~, __sottolineato__) ──

export function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/\n/g, "<br>");
}

export function htmlToMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walk).join("");
    switch (el.tagName.toLowerCase()) {
      case "b":
      case "strong":
        return `**${inner}**`;
      case "i":
      case "em":
        return `*${inner}*`;
      case "s":
      case "strike":
        return `~~${inner}~~`;
      case "u":
        return `__${inner}__`;
      case "br":
        return "\n";
      case "div":
      case "p":
        return inner + "\n";
      default:
        return inner;
    }
  }

  return Array.from(div.childNodes).map(walk).join("").replace(/\n+$/, "");
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/__(.+?)__/g, "$1");
}

/** PUT sostituisce tutto il banner: per spostarlo serve rimandare ogni campo. */
export function bannerPayload(banner: Banner, position: number) {
  return {
    id: banner.id,
    label: banner.label,
    type: banner.type,
    position,
    title: banner.title ?? null,
    description: banner.description ?? null,
    website: banner.website ?? null,
    facebook: banner.facebook ?? null,
    instagram: banner.instagram ?? null,
    telephone: banner.telephone ?? null,
    color: normalizeHex(banner.color),
    startsAt: banner.startsAt ? new Date(banner.startsAt).toISOString() : null,
    endsAt: banner.endsAt ? new Date(banner.endsAt).toISOString() : null,
    visibleFrom: new Date(banner.visibleFrom).toISOString(),
  };
}
