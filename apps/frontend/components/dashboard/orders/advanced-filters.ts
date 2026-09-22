import type { OrderStatus } from "@/lib/api-types";

// Shared by the server page and the client: no browser-only APIs outside the storage helpers

export type DatePreset = "any" | "today" | "yesterday" | "range";
export type OrdersSortBy = "createdAt" | "confirmedAt" | "completedAt";

export interface AdvancedOrderFilters {
  displayCode: string;
  ticketNumber: string;
  status: OrderStatus[];
  onlyDiscounted: boolean;
  sortBy: OrdersSortBy;
  datePreset: DatePreset;
  // Calendar days as "yyyy-MM-dd", used only when datePreset === "range"
  rangeFrom?: string;
  rangeTo?: string;
}

export interface OrdersQuery {
  search?: string;
  displayCode?: string;
  ticketNumber?: number;
  status?: OrderStatus[];
  onlyDiscounted?: boolean;
  sortBy?: OrdersSortBy;
  dateFrom?: string;
  dateTo?: string;
}

/** State of the orders page encoded in the URL, so a reload repeats the same GET. */
export interface OrdersPageState {
  search: string;
  advanced: AdvancedOrderFilters | null;
  page: number;
}

export const EMPTY_ADVANCED_FILTERS: AdvancedOrderFilters = {
  displayCode: "",
  ticketNumber: "",
  status: [],
  onlyDiscounted: false,
  sortBy: "createdAt",
  datePreset: "any",
};

// Day boundaries ("today", ranges) follow the event timezone, not the server/browser one
export const ORDERS_TIMEZONE = "Europe/Rome";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PARTIAL", "COMPLETED", "PICKED_UP", "CANCELLED"];
const DATE_PRESETS: DatePreset[] = ["any", "today", "yesterday", "range"];
const SORT_FIELDS: OrdersSortBy[] = ["createdAt", "confirmedAt", "completedAt"];
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── Dates ───────────────────────────────────────────────────────────────────

/** Local calendar day of a Date as "yyyy-MM-dd" (for the date picker). */
export function toYmd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "yyyy-MM-dd" as a local Date at midnight (for the date picker). */
export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function zonedYmd(date: Date, timeZone: string): [number, number, number] {
  // en-CA formats as yyyy-MM-dd
  const s = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const [y, m, d] = s.split("-").map(Number);
  return [y, m, d];
}

function tzOffsetMs(date: Date, timeZone: string): number {
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
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instant of 00:00 of the given calendar day in `timeZone` (DST-safe). */
function zonedMidnight(y: number, m: number, d: number, timeZone: string): Date {
  const guess = Date.UTC(y, m - 1, d);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  let t = guess - offset;
  const offset2 = tzOffsetMs(new Date(t), timeZone);
  if (offset2 !== offset) t = guess - offset2;
  return new Date(t);
}

function dayBounds(y: number, m: number, d: number, timeZone: string) {
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const start = zonedMidnight(y, m, d, timeZone);
  const end = new Date(
    zonedMidnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone).getTime() - 1,
  );
  return { start, end };
}

/** Resolves the date preset into absolute bounds at request time. */
export function resolveDateBounds(
  f: AdvancedOrderFilters,
  timeZone = ORDERS_TIMEZONE,
  now = new Date(),
): { dateFrom?: string; dateTo?: string } {
  switch (f.datePreset) {
    case "today": {
      const [y, m, d] = zonedYmd(now, timeZone);
      return { dateFrom: dayBounds(y, m, d, timeZone).start.toISOString() };
    }
    case "yesterday": {
      const [y, m, d] = zonedYmd(now, timeZone);
      const prev = new Date(Date.UTC(y, m - 1, d - 1));
      const { start, end } = dayBounds(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate(), timeZone);
      return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
    }
    case "range": {
      if (!f.rangeFrom) return {};
      const [fy, fm, fd] = f.rangeFrom.split("-").map(Number);
      const [ty, tm, td] = (f.rangeTo ?? f.rangeFrom).split("-").map(Number);
      return {
        dateFrom: dayBounds(fy, fm, fd, timeZone).start.toISOString(),
        dateTo: dayBounds(ty, tm, td, timeZone).end.toISOString(),
      };
    }
    default:
      return {};
  }
}

// ─── Query ───────────────────────────────────────────────────────────────────

export function toOrdersQuery(f: AdvancedOrderFilters): OrdersQuery {
  const code = f.displayCode.trim().toUpperCase();
  const ticket = parseInt(f.ticketNumber, 10);
  return {
    displayCode: code || undefined,
    ticketNumber: Number.isInteger(ticket) && ticket > 0 ? ticket : undefined,
    status: f.status.length > 0 ? f.status : undefined,
    onlyDiscounted: f.onlyDiscounted || undefined,
    sortBy: f.sortBy !== "createdAt" ? f.sortBy : undefined,
    ...resolveDateBounds(f),
  };
}

/** Params sent to GET /orders for a page state (advanced filters win over the plain search). */
export function pageStateToQuery(state: OrdersPageState): OrdersQuery {
  if (state.advanced) return toOrdersQuery(state.advanced);
  return state.search ? { search: state.search } : {};
}

export function countActiveFilters(f: AdvancedOrderFilters): number {
  let n = 0;
  if (f.displayCode.trim()) n++;
  if (f.ticketNumber.trim()) n++;
  if (f.status.length > 0) n++;
  if (f.onlyDiscounted) n++;
  if (f.sortBy !== "createdAt") n++;
  if (f.datePreset !== "any") n++;
  return n;
}

// ─── URL ─────────────────────────────────────────────────────────────────────

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function all(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/** Reads the page state from the URL, ignoring invalid values. */
export function parsePageState(params: RawSearchParams): OrdersPageState {
  const pageNum = parseInt(first(params.page) ?? "", 10);
  const page = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;

  const code = (first(params.code) ?? "").trim().toUpperCase();
  const ticket = (first(params.ticket) ?? "").trim();
  const status = all(params.status).filter((s): s is OrderStatus => ORDER_STATUSES.includes(s as OrderStatus));
  const date = first(params.date) as DatePreset | undefined;
  const from = first(params.from);
  const to = first(params.to);
  const sort = first(params.sort) as OrdersSortBy | undefined;

  const advanced: AdvancedOrderFilters = {
    displayCode: /^[A-Z0-9]{3,5}$/.test(code) ? code : "",
    ticketNumber: /^[1-9]\d*$/.test(ticket) ? ticket : "",
    status: Array.from(new Set(status)),
    onlyDiscounted: first(params.onlyDiscounted) === "true",
    sortBy: sort && SORT_FIELDS.includes(sort) ? sort : "createdAt",
    datePreset: date && DATE_PRESETS.includes(date) ? date : "any",
  };
  if (advanced.datePreset === "range") {
    if (from && YMD_RE.test(from)) {
      advanced.rangeFrom = from;
      if (to && YMD_RE.test(to) && to >= from) advanced.rangeTo = to;
    } else {
      advanced.datePreset = "any";
    }
  }

  return {
    search: first(params.search) ?? "",
    advanced: countActiveFilters(advanced) > 0 ? advanced : null,
    page,
  };
}

/** Encodes the page state as URL search params (defaults omitted). */
export function pageStateToSearchParams(state: OrdersPageState): URLSearchParams {
  const sp = new URLSearchParams();
  const f = state.advanced;
  if (f) {
    if (f.displayCode) sp.set("code", f.displayCode);
    if (f.ticketNumber) sp.set("ticket", f.ticketNumber);
    f.status.forEach((s) => sp.append("status", s));
    if (f.datePreset !== "any") sp.set("date", f.datePreset);
    if (f.datePreset === "range" && f.rangeFrom) {
      sp.set("from", f.rangeFrom);
      if (f.rangeTo) sp.set("to", f.rangeTo);
    }
    if (f.sortBy !== "createdAt") sp.set("sort", f.sortBy);
    if (f.onlyDiscounted) sp.set("onlyDiscounted", "true");
  } else if (state.search) {
    sp.set("search", state.search);
  }
  if (state.page > 1) sp.set("page", String(state.page));
  return sp;
}

// ─── Storage (browser only) ──────────────────────────────────────────────────

export const ADVANCED_FILTERS_STORAGE_KEY = "mysagra-orders-advanced-filters";

/** Last filters submitted in the dialog: prefill it even when no filter is applied. */
export function loadStoredFilters(): AdvancedOrderFilters | null {
  try {
    const raw = localStorage.getItem(ADVANCED_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const f: AdvancedOrderFilters = { ...EMPTY_ADVANCED_FILTERS, ...JSON.parse(raw) };
    // Older versions stored ISO timestamps for the range
    if (f.rangeFrom && !YMD_RE.test(f.rangeFrom)) f.rangeFrom = toYmd(new Date(f.rangeFrom));
    if (f.rangeTo && !YMD_RE.test(f.rangeTo)) f.rangeTo = toYmd(new Date(f.rangeTo));
    return f;
  } catch {
    return null;
  }
}

export function storeFilters(f: AdvancedOrderFilters) {
  try {
    localStorage.setItem(ADVANCED_FILTERS_STORAGE_KEY, JSON.stringify(f));
  } catch {
    // storage unavailable (private mode, blocked site data) — filters stay in memory only
  }
}
