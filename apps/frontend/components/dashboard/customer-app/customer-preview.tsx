"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Globe,
  LogOut,
  Phone,
  ShoppingCart,
} from "lucide-react";
import { Banner, BannerType } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { useTimezone } from "@/contexts/timezone-context";
import { fill } from "@/components/dashboard/menu/menu-utils";
import { bannerImageUrl, normalizeHex, type PreviewCategory } from "./customer-app-utils";

// Le anteprime copiano MyClienti (repo myclienti): stessi componenti, classi e tema chiaro.

/** Quello che serve per disegnare un banner: viene dal form mentre lo si modifica. */
export interface BannerDraft {
  /** null = banner non ancora creato */
  id: string | null;
  type: BannerType;
  title: string;
  description: string;
  color: string;
  imageUrl: string | null;
  /** Date ISO */
  startsAt: string | null;
  endsAt: string | null;
  /** null = visibile da subito */
  visibleFrom: string | null;
  links: { website: boolean; facebook: boolean; instagram: boolean; telephone: boolean };
}

export function bannerToDraft(banner: Banner): BannerDraft {
  const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
  return {
    id: banner.id,
    type: banner.type,
    title: banner.title?.trim() ?? "",
    description: banner.description ?? "",
    color: normalizeHex(banner.color),
    imageUrl: banner.image ? bannerImageUrl(banner.image) : null,
    startsAt: iso(banner.startsAt),
    endsAt: iso(banner.endsAt),
    visibleFrom: iso(banner.visibleFrom),
    links: {
      website: !!banner.website,
      facebook: !!banner.facebook,
      instagram: !!banner.instagram,
      telephone: !!banner.telephone,
    },
  };
}

/** Stesso filtro di BannerCarousel in MyClienti. */
export function isBannerShown(draft: BannerDraft, now = Date.now()) {
  const visible = !draft.visibleFrom || new Date(draft.visibleFrom).getTime() <= now;
  const ended = draft.type === "EVENT" && !!draft.endsAt && new Date(draft.endsAt).getTime() <= now;
  return visible && !ended;
}

export function BannerThumb({
  imageUrl,
  color,
  className,
}: {
  imageUrl: string | null;
  color: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className={cn("h-11 w-15 shrink-0 rounded-md object-cover", className)} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("h-11 w-15 shrink-0 rounded-md", className)}
      style={{ backgroundColor: `#${normalizeHex(color)}` }}
    />
  );
}

// ── Telefono ─────────────────────────────────────────────────────────

/** Tema chiaro di MyClienti (app/globals.css :root), anche se il pannello è scuro. */
const CLIENT_THEME = {
  colorScheme: "light",
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0.141 0.005 285.823)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.141 0.005 285.823)",
  "--primary": "oklch(0.852 0.199 91.936)",
  "--primary-foreground": "oklch(0.421 0.095 57.708)",
  "--muted": "oklch(0.967 0.001 286.375)",
  "--muted-foreground": "oklch(0.552 0.016 285.938)",
  "--accent": "oklch(0.967 0.001 286.375)",
  "--accent-foreground": "oklch(0.21 0.006 285.885)",
  "--border": "oklch(0.92 0.004 286.32)",
  "--input": "oklch(0.92 0.004 286.32)",
} as CSSProperties;

const SCREEN_WIDTH = 390;
const SCREEN_HEIGHT = 800;
const BEZEL = 10;

/** Schermo a grandezza reale, rimpicciolito per stare nella colonna. */
function PhoneFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / (SCREEN_WIDTH + BEZEL * 2)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // transform invece di zoom: il testo si impagina a grandezza reale, poi si scala tutto
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none overflow-hidden select-none"
      style={{ height: (SCREEN_HEIGHT + BEZEL * 2) * scale }}
    >
      <div
        className="relative left-1/2 origin-top rounded-[3.25rem] border-neutral-800 bg-neutral-800 shadow-xl dark:border-neutral-700 dark:bg-neutral-700"
        style={{
          width: SCREEN_WIDTH + BEZEL * 2,
          borderWidth: BEZEL,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <div
          className="relative flex flex-col overflow-hidden rounded-[2.6rem] bg-background font-sans text-foreground antialiased"
          style={{ ...CLIENT_THEME, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** components/Header.tsx */
function ClientHeader() {
  return (
    <header className="z-10 shrink-0 border-b border-border bg-card">
      <div className="px-4">
        <nav className="relative flex items-center justify-between py-3">
          <span className="flex items-center gap-2 font-bold text-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="mx-auto h-8 w-auto" />
            MySagra
          </span>
          <div className="absolute right-0 flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="size-5 text-foreground" />
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <LogOut className="size-5 text-foreground" />
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ── Banner (components/BannerCarousel.tsx) ───────────────────────────

const CREAM = "#FAF8F5";
const CHARCOAL = "#2B2B2B";

function isDark(hex: string) {
  const h = normalizeHex(hex);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.75;
}

const textFor = (hex: string) => (isDark(hex) ? CREAM : CHARCOAL);
const subTextFor = (hex: string) => (isDark(hex) ? "rgba(250,248,245,0.75)" : "rgba(43,43,43,0.65)");

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FlipDigit({ value, dark }: { value: string; dark: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[5px] font-bold tabular-nums"
      style={{
        width: 22,
        height: 30,
        fontSize: 16,
        lineHeight: 1,
        backgroundColor: dark ? CREAM : CHARCOAL,
        color: dark ? CHARCOAL : CREAM,
        boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.3)",
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </span>
  );
}

function FlipGroup({ val, label, dark }: { val: number; label: string; dark: boolean }) {
  const str = String(val).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex gap-0.5">
        <FlipDigit value={str[0]} dark={dark} />
        <FlipDigit value={str[1]} dark={dark} />
      </div>
      <span
        className="text-[8px] font-medium tracking-wider uppercase"
        style={{ color: dark ? "rgba(250,248,245,0.6)" : "rgba(43,43,43,0.5)" }}
      >
        {label}
      </span>
    </div>
  );
}

function FlipSeparator({ dark }: { dark: boolean }) {
  return (
    <span
      className="mx-px mt-1.5 self-start text-sm font-bold"
      style={{ color: dark ? "rgba(250,248,245,0.5)" : "rgba(43,43,43,0.4)" }}
    >
      :
    </span>
  );
}

function CountdownTimer({ target, color }: { target: Date; color: string }) {
  const { t, locale } = useLocale();
  const timeZone = useTimezone();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (now === null) return null;
  const diffMs = Math.max(0, target.getTime() - now);
  if (diffMs === 0) return null;

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const dark = isDark(color);

  const date = new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(target);

  const [first, second]: [number, string][] =
    days > 0
      ? [[days, t.customerApp.previewDays], [hours, t.customerApp.previewHours]]
      : hours > 0
        ? [[hours, t.customerApp.previewHours], [minutes, t.customerApp.previewMinutes]]
        : [[minutes, t.customerApp.previewMinutes], [seconds, t.customerApp.previewSeconds]];

  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl px-2.5 py-2"
      style={{ backgroundColor: `#${color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
    >
      <div
        className="text-center text-[10px] font-bold tracking-wider uppercase"
        style={{ color: subTextFor(color) }}
      >
        {date.replace(",", " -")}
      </div>
      <div className="flex items-start gap-0.75">
        <FlipGroup val={first[0]} label={first[1]} dark={dark} />
        <FlipSeparator dark={dark} />
        <FlipGroup val={second[0]} label={second[1]} dark={dark} />
      </div>
    </div>
  );
}

function BannerSlide({ draft }: { draft: BannerDraft }) {
  const { t } = useLocale();
  const color = normalizeHex(draft.color);
  const badgeText = textFor(color);
  const iconStyle = draft.imageUrl
    ? { backgroundColor: `#${color}cc`, color: badgeText }
    : { backgroundColor: "rgba(0,0,0,0.2)", color: CREAM };
  const eventDate = draft.type === "EVENT" && draft.startsAt ? new Date(draft.startsAt) : null;
  const icons = [
    draft.links.website && Globe,
    draft.links.facebook && FacebookIcon,
    draft.links.instagram && InstagramIcon,
    draft.links.telephone && Phone,
  ].filter(Boolean) as ((props: { className?: string }) => ReactNode)[];

  return (
    <div className="absolute inset-0" style={{ backgroundColor: `#${color}` }}>
      {draft.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {(draft.title || draft.description) && (
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
      )}

      <div className="absolute top-0 right-0 left-0 z-10 flex items-start justify-between p-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase"
          style={{ backgroundColor: `#${color}`, color: badgeText }}
        >
          {draft.type === "EVENT" ? t.customerApp.typeEvent : t.customerApp.typeSponsor}
        </span>
        <div className="flex flex-col items-end gap-2">
          {/* sparisce da solo quando l'evento è iniziato */}
          {eventDate && <CountdownTimer target={eventDate} color={color} />}
          <div className="flex items-center gap-2">
            {icons.map((Icon, i) => (
              <span key={i} className="rounded-full p-1.5" style={iconStyle}>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10 p-4">
        {draft.title && (
          <h2 className="text-xl leading-tight font-bold" style={{ color: CREAM }}>
            {draft.title}
          </h2>
        )}
        {draft.description && (
          <p className="mt-1 line-clamp-2 text-sm" style={{ color: "rgba(250,248,245,0.8)" }}>
            {draft.description}
          </p>
        )}
      </div>
    </div>
  );
}

function BannerCarouselPreview({ slides, index }: { slides: BannerDraft[]; index: number }) {
  if (slides.length === 0) return null;
  const current = slides[index] ?? slides[0];
  const color = normalizeHex(current.color);

  return (
    <div>
      <div className="relative aspect-15/11 w-full overflow-hidden rounded-md shadow-sm">
        <BannerSlide draft={current} />
        {slides.length > 1 && (
          <>
            <span className="absolute top-1/2 left-2 z-30 -translate-y-1/2 rounded-full p-1.5" style={{ backgroundColor: `#${color}cc` }}>
              <ChevronLeft className="h-4 w-4 text-white" />
            </span>
            <span className="absolute top-1/2 right-2 z-30 -translate-y-1/2 rounded-full p-1.5" style={{ backgroundColor: `#${color}cc` }}>
              <ChevronRight className="h-4 w-4 text-white" />
            </span>
          </>
        )}
      </div>
      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {slides.map((slide, i) => {
            const dot = `#${normalizeHex(slide.color)}`;
            const active = i === index;
            return (
              <span
                key={slide.id ?? "new"}
                className="relative overflow-hidden rounded-full"
                style={{
                  height: 6,
                  width: active ? 32 : 6,
                  backgroundColor: active ? "transparent" : dot,
                  opacity: active ? 1 : 0.4,
                }}
              >
                {active && (
                  <>
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "color-mix(in srgb, var(--muted-foreground) 30%, transparent)" }}
                    />
                    <span className="absolute top-0 left-0 h-full w-3/5 rounded-full" style={{ backgroundColor: dot }} />
                  </>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Menù (app/menu/page.tsx + components/CategoryCard.tsx) ──────────

function CategoryCard({ category }: { category: PreviewCategory }) {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-md bg-card shadow-sm">
      <div className="aspect-15/4 overflow-hidden bg-muted">
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {t.customerApp.previewNoImage}
          </div>
        )}
      </div>
      <div className="bg-primary px-4 py-3">
        <h3 className="text-center font-semibold tracking-wide text-primary-foreground uppercase">{category.name}</h3>
      </div>
    </div>
  );
}

export function BannerPreview({
  slides,
  index,
  categories,
}: {
  /** Banner del carosello, nell'ordine dei clienti */
  slides: BannerDraft[];
  index: number;
  categories: PreviewCategory[];
}) {
  const { t } = useLocale();
  const shown: PreviewCategory[] =
    categories.length > 0
      ? categories.slice(0, 4)
      : t.customerApp.previewSampleCategories.split(",").map((name) => ({ id: name, name, imageUrl: null }));

  return (
    <PhoneFrame>
      <ClientHeader />
      <main className="relative flex-1 overflow-hidden">
        <div className="px-4 py-6">
          <div className="grid gap-4 pb-8">
            <BannerCarouselPreview slides={slides} index={index} />
            {shown.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
        <div className="absolute right-0 bottom-0 left-0 h-16 bg-linear-to-t from-background to-transparent" />
      </main>
    </PhoneFrame>
  );
}

// ── Conferma ordine (app/confirmation/components/ConfirmationContent.tsx) ──

/** Markdown in linea con stili annidati: **grassetto**, *corsivo*, __sottolineato__, ~~barrato~~ */
function InlineMarkdown({ text }: { text: string }) {
  const elements: ReactNode[] = [];
  const active = new Set<string>();
  let buffer = "";
  let key = 0;

  const flush = () => {
    if (!buffer) return;
    let el: ReactNode = buffer;
    if (active.has("**")) el = <strong>{el}</strong>;
    if (active.has("*")) el = <em>{el}</em>;
    if (active.has("__")) el = <u>{el}</u>;
    if (active.has("~~")) el = <s>{el}</s>;
    elements.push(<span key={key++}>{el}</span>);
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (two === "**" || two === "__" || two === "~~") {
      flush();
      if (active.has(two)) active.delete(two);
      else active.add(two);
      i += 2;
      continue;
    }
    if (text[i] === "*") {
      flush();
      if (active.has("*")) active.delete("*");
      else active.add("*");
      i += 1;
      continue;
    }
    buffer += text[i];
    i++;
  }
  flush();

  return <>{elements}</>;
}

export function InstructionsPreview({ steps, activeIndex }: { steps: string[]; activeIndex: number | null }) {
  const { t } = useLocale();
  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col justify-center p-4">
        <div className="w-full text-center">
          <CheckCircle className="mx-auto mb-6 h-16 w-16 text-primary" />
          <h1 className="mb-1 text-2xl font-bold text-foreground">{t.customerApp.previewOrderCodeTitle}</h1>
          <p className="mb-8 text-xl font-bold text-foreground">{t.customerApp.previewOrderCodeSubtitle}</p>
          <div className="mb-8 font-mono text-8xl font-black tracking-wider text-primary">PDW</div>
          <div className="mb-8">
            <p className="mb-2 text-2xl font-bold text-foreground">{fill(t.customerApp.previewPay, { amount: "15.50€" })}</p>
            <p className="text-sm text-muted-foreground">{t.customerApp.previewPayHint}</p>
          </div>

          {steps.length > 0 && (
            <div className="mb-8 rounded-lg border border-border bg-card p-6 text-left shadow-sm">
              <h2 className="mb-4 text-center text-xl font-bold text-foreground">{t.customerApp.previewWhatNow}</h2>
              <ol className="list-none space-y-3">
                {steps.map((text, index) => (
                  <li
                    key={index}
                    className={cn(
                      "-mx-2 flex items-start gap-3 rounded-md px-2",
                      index === activeIndex && "bg-primary/15 ring-1 ring-primary"
                    )}
                  >
                    <span className="min-w-6 text-lg font-bold text-primary">{index + 1}.</span>
                    <span className={cn("text-foreground", !text && "text-muted-foreground")}>
                      {text ? <InlineMarkdown text={text} /> : "…"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex h-14 w-full items-center justify-center rounded-md bg-primary text-lg font-semibold text-primary-foreground">
            {t.customerApp.previewNewOrder}
          </div>
          <div className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md border bg-background text-base font-medium shadow-xs">
            <ClipboardList className="mr-2 h-5 w-5" />
            {t.customerApp.previewOrderSummary}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
