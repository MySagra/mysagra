"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it as itLocale } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  Activity,
  ArrowDownWideNarrow,
  CalendarIcon,
  Check,
  Hash,
  RotateCcw,
  SearchIcon,
  SlidersHorizontal,
  Tag,
  Ticket,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api-types";
import {
  EMPTY_ADVANCED_FILTERS,
  type AdvancedOrderFilters,
  type DatePreset,
  type OrdersSortBy,
  parseYmd,
  toYmd,
} from "./advanced-filters";
import { statusConfig } from "./order-status";

const STATUS_ORDER: OrderStatus[] = ["PENDING", "CONFIRMED", "PARTIAL", "COMPLETED", "PICKED_UP", "CANCELLED"];

interface OrdersAdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedOrderFilters;
  onApply: (filters: AdvancedOrderFilters) => void;
}

export function OrdersAdvancedSearchDialog({ open, onOpenChange, filters, onApply }: OrdersAdvancedSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Content unmounts on close, so the form restarts from the last applied filters */}
        <AdvancedSearchForm
          initial={filters}
          onApply={(f) => {
            onApply(f);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AdvancedSearchForm({
  initial,
  onApply,
  onCancel,
}: {
  initial: AdvancedOrderFilters;
  onApply: (filters: AdvancedOrderFilters) => void;
  onCancel: () => void;
}) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "it" ? itLocale : undefined;
  const [draft, setDraft] = useState<AdvancedOrderFilters>(initial);

  const update = <K extends keyof AdvancedOrderFilters>(key: K, value: AdvancedOrderFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const statusLabels: Record<OrderStatus, string> = {
    PENDING: t.orders.statusPending,
    CONFIRMED: t.orders.statusConfirmed,
    PARTIAL: t.orders.statusPartial,
    COMPLETED: t.orders.statusCompleted,
    PICKED_UP: t.orders.statusPickedUp,
    CANCELLED: t.orders.statusCancelled,
  };

  const toggleStatus = (status: OrderStatus) =>
    update(
      "status",
      draft.status.includes(status) ? draft.status.filter((s) => s !== status) : [...draft.status, status],
    );

  const datePresets: { value: DatePreset; label: string }[] = [
    { value: "any", label: t.orders.advDateAny },
    { value: "today", label: t.orders.advDateToday },
    { value: "yesterday", label: t.orders.advDateYesterday },
    { value: "range", label: t.orders.advDateRange },
  ];

  const code = draft.displayCode.trim();
  const codeInvalid = code.length > 0 && (code.length < 3 || code.length > 5);
  const ticket = draft.ticketNumber.trim();
  const ticketInvalid = ticket.length > 0 && !/^[1-9]\d*$/.test(ticket);
  const rangeInvalid = draft.datePreset === "range" && !draft.rangeFrom;
  const canSubmit = !codeInvalid && !ticketInvalid && !rangeInvalid;

  const selectedRange: DateRange | undefined = draft.rangeFrom
    ? {
        from: parseYmd(draft.rangeFrom),
        to: draft.rangeTo ? parseYmd(draft.rangeTo) : undefined,
      }
    : undefined;

  const rangeLabel = selectedRange?.from
    ? selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime()
      ? `${format(selectedRange.from, "PP", { locale: dateLocale })} → ${format(selectedRange.to, "PP", { locale: dateLocale })}`
      : format(selectedRange.from, "PP", { locale: dateLocale })
    : t.orders.advPickRange;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onApply({ ...draft, displayCode: code.toUpperCase(), ticketNumber: ticket });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <DialogHeader className="flex-row items-start gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <DialogTitle>{t.orders.advTitle}</DialogTitle>
          <DialogDescription>{t.orders.advDescription}</DialogDescription>
        </div>
      </DialogHeader>

      {/* Code + ticket */}
      <div className="grid grid-cols-2 gap-3">
        <Field icon={<Hash className="h-3 w-3" />} label={t.orders.detailCode} htmlFor="adv-code">
          <Input
            id="adv-code"
            value={draft.displayCode}
            onChange={(e) => update("displayCode", e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="AB00"
            aria-invalid={codeInvalid}
            className="h-10 px-3 font-mono uppercase tracking-wider placeholder:text-muted-foreground/40"
          />
          {codeInvalid && <p className="text-xs text-destructive">{t.orders.advCodeInvalid}</p>}
        </Field>
        <Field icon={<Ticket className="h-3 w-3" />} label={t.orders.detailTicket} htmlFor="adv-ticket">
          <Input
            id="adv-ticket"
            inputMode="numeric"
            value={draft.ticketNumber}
            onChange={(e) => update("ticketNumber", e.target.value.replace(/\D/g, ""))}
            placeholder="000"
            aria-invalid={ticketInvalid}
            className="h-10 px-3 font-mono tracking-wider placeholder:text-muted-foreground/40"
          />
          {ticketInvalid && <p className="text-xs text-destructive">{t.orders.advTicketInvalid}</p>}
        </Field>
      </div>

      {/* Status (multi) */}
      <Field icon={<Activity className="h-3 w-3" />} label={t.orders.detailStatus}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            const active = draft.status.includes(status);
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStatus(status)}
                className={cn(
                  "flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? cn(cfg.bgClass, cfg.colorClass)
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {active ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.colorClass)} />
                )}
                <span className="truncate">{statusLabels[status]}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {/* Creation date */}
      <Field icon={<CalendarIcon className="h-3 w-3" />} label={t.orders.advDate}>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
          {datePresets.map((p) => {
            const active = draft.datePreset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={active}
                onClick={() => update("datePreset", p.value)}
                className={cn(
                  "flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {draft.datePreset === "range" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("h-10 w-full justify-center font-normal", !selectedRange && "text-muted-foreground")}
              >
                <CalendarIcon className="h-4 w-4" />
                {rangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={selectedRange}
                onSelect={(r) =>
                  setDraft((prev) => ({
                    ...prev,
                    rangeFrom: r?.from ? toYmd(r.from) : undefined,
                    rangeTo: r?.to ? toYmd(r.to) : undefined,
                  }))
                }
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        )}
      </Field>

      {/* Sort */}
      <Field icon={<ArrowDownWideNarrow className="h-3 w-3" />} label={t.orders.advSortBy}>
        <Select value={draft.sortBy} onValueChange={(v) => update("sortBy", v as OrdersSortBy)}>
          <SelectTrigger className="w-full px-3 data-[size=default]:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="p-1.5">
            <SelectItem value="createdAt" className="py-2.5 pl-3">
              {t.orders.detailCreationDate}
            </SelectItem>
            <SelectItem value="confirmedAt" className="py-2.5 pl-3">
              {t.orders.detailConfirmationDate}
            </SelectItem>
            <SelectItem value="completedAt" className="py-2.5 pl-3">
              {t.orders.detailCompletionDate}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* Only discounted */}
      <label
        htmlFor="adv-discounted"
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
          draft.onlyDiscounted ? "border-primary/40 bg-primary/5" : "hover:bg-muted/40",
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors",
            draft.onlyDiscounted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Tag className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{t.orders.advOnlyDiscounted}</p>
          <p className="text-xs text-muted-foreground">{t.orders.onlyDiscountedTitle}</p>
        </div>
        <Switch
          id="adv-discounted"
          checked={draft.onlyDiscounted}
          onCheckedChange={(v) => update("onlyDiscounted", v)}
        />
      </label>

      <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setDraft(EMPTY_ADVANCED_FILTERS)}
          className="mr-auto gap-2 text-muted-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          {t.orders.advReset}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-9 px-4">
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={!canSubmit} className="h-9 gap-2 px-4">
          <SearchIcon className="h-4 w-4" />
          {t.orders.advSubmit}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
