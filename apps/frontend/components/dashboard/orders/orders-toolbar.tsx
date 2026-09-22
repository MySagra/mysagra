"use client";

import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowDownWideNarrow,
  CalendarIcon,
  Hash,
  RefreshCw,
  SearchIcon,
  SlidersHorizontal,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api-types";
import { parseYmd, type AdvancedOrderFilters } from "./advanced-filters";
import { statusConfig } from "./order-status";

interface OrdersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAdvanced: () => void;
  advancedActive: boolean;
  advancedFilters: AdvancedOrderFilters;
  advancedCount: number;
  onClearAdvanced: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function OrdersToolbar({
  searchQuery,
  onSearchChange,
  onOpenAdvanced,
  advancedActive,
  advancedFilters,
  advancedCount,
  onClearAdvanced,
  onRefresh,
  isLoading,
}: OrdersToolbarProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Standard search */}
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.orders.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn("h-10 truncate pl-9 placeholder:text-sm placeholder:text-muted-foreground/70", searchQuery ? "pr-9" : "pr-3")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={t.orders.clearSearch}
              title={t.orders.clearSearch}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Advanced search */}
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenAdvanced}
          title={t.orders.advButton}
          aria-label={t.orders.advButton}
          className={cn(
            "relative h-10 w-10 text-primary hover:text-primary",
            advancedActive && "border-primary/50 bg-primary/10 hover:bg-primary/15",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {advancedActive && advancedCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-primary-foreground ring-2 ring-background">
              {advancedCount}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          title={t.orders.refreshTitle}
          aria-label={t.orders.refreshTitle}
          className="h-10 w-10"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Active advanced filters summary */}
      {advancedActive && (
        <ActiveFilters filters={advancedFilters} onEdit={onOpenAdvanced} onClear={onClearAdvanced} />
      )}
    </div>
  );
}

function ActiveFilters({
  filters,
  onEdit,
  onClear,
}: {
  filters: AdvancedOrderFilters;
  onEdit: () => void;
  onClear: () => void;
}) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;

  const statusLabels: Record<OrderStatus, string> = {
    PENDING: t.orders.statusPending,
    CONFIRMED: t.orders.statusConfirmed,
    PARTIAL: t.orders.statusPartial,
    COMPLETED: t.orders.statusCompleted,
    PICKED_UP: t.orders.statusPickedUp,
    CANCELLED: t.orders.statusCancelled,
  };

  const sortLabels = {
    createdAt: t.orders.detailCreationDate,
    confirmedAt: t.orders.detailConfirmationDate,
    completedAt: t.orders.detailCompletionDate,
  };

  let dateLabel: string | null = null;
  if (filters.datePreset === "today") dateLabel = t.orders.advDateToday;
  else if (filters.datePreset === "yesterday") dateLabel = t.orders.advDateYesterday;
  else if (filters.datePreset === "range" && filters.rangeFrom) {
    const from = format(parseYmd(filters.rangeFrom), "dd/MM", { locale: dateLocale });
    const to = filters.rangeTo ? format(parseYmd(filters.rangeTo), "dd/MM", { locale: dateLocale }) : null;
    dateLabel = to && to !== from ? `${from} → ${to}` : from;
  }

  // Chips are hidden on mobile: only the clear button with the filter count is shown
  const chipClass =
    "hidden sm:inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors hover:bg-muted/60";

  const chipCount =
    (filters.displayCode ? 1 : 0) +
    (filters.ticketNumber ? 1 : 0) +
    filters.status.length +
    (dateLabel ? 1 : 0) +
    (filters.sortBy !== "createdAt" ? 1 : 0) +
    (filters.onlyDiscounted ? 1 : 0);
  const clearCountLabel = (chipCount === 1 ? t.orders.advClearOne : t.orders.advClearMany).replace(
    "{n}",
    String(chipCount),
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.displayCode && (
        <button type="button" onClick={onEdit} className={chipClass}>
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{filters.displayCode}</span>
        </button>
      )}
      {filters.ticketNumber && (
        <button type="button" onClick={onEdit} className={chipClass}>
          <Ticket className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{filters.ticketNumber}</span>
        </button>
      )}
      {filters.status.map((status) => {
        const cfg = statusConfig[status];
        const Icon = cfg.icon;
        return (
          <button
            key={status}
            type="button"
            onClick={onEdit}
            className={chipClass}
          >
            <Icon className="h-3 w-3 text-muted-foreground" />
            {statusLabels[status]}
          </button>
        );
      })}
      {dateLabel && (
        <button type="button" onClick={onEdit} className={chipClass}>
          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
          {dateLabel}
        </button>
      )}
      {filters.sortBy !== "createdAt" && (
        <button type="button" onClick={onEdit} className={chipClass}>
          <ArrowDownWideNarrow className="h-3 w-3 text-muted-foreground" />
          {sortLabels[filters.sortBy]}
        </button>
      )}
      {filters.onlyDiscounted && (
        <button type="button" onClick={onEdit} className={chipClass}>
          <Tag className="h-3 w-3 text-muted-foreground" />
          {t.orders.onlyDiscounted}
        </button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
      >
        <X className="hidden h-3.5 w-3.5 sm:block" />
        <span className="hidden sm:inline">{t.orders.advClear}</span>
        <span className="sm:hidden">{clearCountLabel}</span>
      </button>
    </div>
  );
}
