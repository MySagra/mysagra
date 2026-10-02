"use client";

import type { SettingsData } from "@mysagra/schemas";
import { Banknote, CreditCard, Minus, Pencil, Percent, Plus, Search, Trash2, UserX, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { Field } from "./setup-field";
import type { SetupErrors } from "./setup-wizard";

type FieldMode = SettingsData["orders"]["customer"];
type TableInput = SettingsData["orders"]["tableInputs"][number];

const FIELD_MODES: FieldMode[] = ["HIDDEN", "OPTIONAL", "REQUIRED"];

interface SetupCashierStepProps {
  settings: SettingsData;
  errors: SetupErrors;
  onChange: (settings: SettingsData) => void;
}

export function SetupCashierStep({ settings, errors, onChange }: SetupCashierStepProps) {
  const { t } = useLocale();
  const { orders } = settings;

  const modeLabels: Record<FieldMode, string> = {
    HIDDEN: t.setup.modeHidden,
    OPTIONAL: t.setup.modeOptional,
    REQUIRED: t.setup.modeRequired,
  };
  const customerHints: Record<FieldMode, string> = {
    HIDDEN: t.setup.customerHiddenHint,
    OPTIONAL: t.setup.customerOptionalHint,
    REQUIRED: t.setup.customerRequiredHint,
  };
  const tableHints: Record<FieldMode, string> = {
    HIDDEN: t.setup.tableHiddenHint,
    OPTIONAL: t.setup.tableOptionalHint,
    REQUIRED: t.setup.tableRequiredHint,
  };

  function updateOrders(patch: Partial<SettingsData["orders"]>) {
    onChange({ ...settings, orders: { ...orders, ...patch } });
  }

  function toggleTableInput(input: TableInput, checked: boolean) {
    const tableInputs = checked
      ? [...orders.tableInputs, input]
      : orders.tableInputs.filter((i) => i !== input);
    updateOrders({ tableInputs });
  }

  const numberEnabled = orders.tableInputs.includes("NUMBER");

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.setup.cashierTitle}</h1>
          <p className="text-muted-foreground">{t.setup.cashierDescription}</p>
        </div>

        <Field label={t.setup.customerLabel}>
          <ModeSelector
            label={t.setup.customerLabel}
            value={orders.customer}
            labels={modeLabels}
            onChange={(customer) => updateOrders({ customer })}
          />
          <p className="text-xs text-muted-foreground">{customerHints[orders.customer]}</p>
        </Field>

        <Field label={t.setup.tableLabel}>
          <ModeSelector
            label={t.setup.tableLabel}
            value={orders.table}
            labels={modeLabels}
            onChange={(table) => updateOrders({ table })}
          />
          <p className="text-xs text-muted-foreground">{tableHints[orders.table]}</p>
        </Field>

        {orders.table !== "HIDDEN" && (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">{t.setup.tableInputsTitle}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                id="table-input-number"
                checked={numberEnabled}
                title={t.setup.tableInputNumber}
                hint={t.setup.tableInputNumberHint}
                onCheckedChange={(checked) => toggleTableInput("NUMBER", checked)}
              />
              <OptionCard
                id="table-input-text"
                checked={orders.tableInputs.includes("TEXT")}
                title={t.setup.tableInputText}
                hint={t.setup.tableInputTextHint}
                onCheckedChange={(checked) => toggleTableInput("TEXT", checked)}
              />
            </div>
            {errors.tableInputs && <p className="text-xs text-destructive">{errors.tableInputs}</p>}

            <div className="flex items-center gap-3">
              <label htmlFor="setup-max-tables" className={cn("text-sm font-medium", !numberEnabled && "text-muted-foreground")}>
                {t.setup.maxTablesLabel}
              </label>
              <Input
                id="setup-max-tables"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                className="h-10 w-32"
                disabled={!numberEnabled}
                placeholder={t.setup.maxTablesPlaceholder}
                value={orders.maxTables ?? ""}
                onChange={(e) => updateOrders({ maxTables: e.target.value === "" ? null : Number(e.target.value) })}
                aria-invalid={!!errors.maxTables}
              />
            </div>
            {errors.maxTables && <p className="text-xs text-destructive">{errors.maxTables}</p>}
          </div>
        )}

        <OptionCard
          id="show-ticket-numbers"
          checked={settings.showTicketNumbers}
          title={t.setup.ticketLabel}
          hint={t.setup.ticketHint}
          onCheckedChange={(checked) => onChange({ ...settings, showTicketNumbers: checked })}
        />
      </div>

      <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start" aria-label={t.setup.previewTitle}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.setup.previewTitle}</p>
        <CashierPreview settings={settings} />
      </aside>
    </div>
  );
}

function ModeSelector({
  label,
  value,
  labels,
  onChange,
}: {
  label: string;
  value: FieldMode;
  labels: Record<FieldMode, string>;
  onChange: (mode: FieldMode) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 rounded-xl border bg-card p-1">
      {FIELD_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === mode ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
          )}
        >
          {labels[mode]}
        </button>
      ))}
    </div>
  );
}

function OptionCard({
  id,
  checked,
  title,
  hint,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  title: string;
  hint: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        checked ? "border-primary bg-primary/10" : "bg-card hover:bg-muted/50"
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} className="mt-0.5" />
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

// Static mock of the mycassa cart sidebar (CartSidebar / OrderForm / CartItem / PaymentSection):
// shows how the chosen settings look to the cashier. Not interactive.
function CashierPreview({ settings }: { settings: SettingsData }) {
  const { t } = useLocale();
  const { orders } = settings;

  const showCustomer = orders.customer !== "HIDDEN";
  const showTable = orders.table !== "HIDDEN" && orders.tableInputs.length > 0;
  const hasNumber = orders.tableInputs.includes("NUMBER");
  const hasText = orders.tableInputs.includes("TEXT");

  const tablePlaceholder = hasNumber && hasText
    ? t.setup.previewTableBothPlaceholder
    : hasText
      ? t.setup.previewTableTextPlaceholder
      : orders.maxTables
        ? t.setup.previewTableRangePlaceholder.replace("{max}", String(orders.maxTables))
        : t.setup.previewTableNumberPlaceholder;

  const items = [
    { name: t.setup.previewItem1, price: "7.00" },
    { name: t.setup.previewItem2, price: "3.00" },
  ];

  // fake controls: same look as the real ones, but inert
  const fakeInput = "flex h-9 items-center rounded-md border bg-transparent px-3 text-sm text-muted-foreground dark:bg-input/30";
  const fakeIconButton = "flex size-8 shrink-0 items-center justify-center rounded-md border bg-background dark:bg-input/30";

  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-xl border bg-card shadow-lg" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4 pb-2">
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold">{t.setup.previewCart}</p>
          {settings.showTicketNumbers && (
            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
              {t.setup.previewTicket} 42
            </span>
          )}
        </div>
        <span className="rounded-md border px-2.5 py-1.5 text-xs font-medium">{t.setup.previewDailyOrders}</span>
      </div>

      {/* OrderForm */}
      <div className="space-y-2 p-4 pt-2">
        <p className="text-xs font-medium">{t.setup.previewLoadOrder}</p>
        <div className="flex gap-2">
          <div className="flex flex-1">
            <div className={cn(fakeInput, "flex-1 rounded-r-none text-xs uppercase")}>{t.setup.previewOrderCodePlaceholder}</div>
            <div className="flex w-10 items-center justify-center rounded-r-md bg-primary text-primary-foreground">
              <Search className="size-4" />
            </div>
          </div>
          <div className={cn(fakeIconButton, "size-9")}>
            <UserX className="size-4" />
          </div>
        </div>

        {(showCustomer || showTable) && (
          <div className={cn("grid gap-3 pt-1", showCustomer && showTable ? "grid-cols-2" : "grid-cols-1")}>
            {showCustomer && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">
                  {t.setup.previewCustomer}{orders.customer === "REQUIRED" && " *"}
                </p>
                <div className={cn(fakeInput, "truncate")}>{t.setup.previewCustomerPlaceholder}</div>
              </div>
            )}
            {showTable && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">
                  {t.setup.previewTable}{orders.table === "REQUIRED" && " *"}
                </p>
                <div className={cn(fakeInput, "truncate")}>{tablePlaceholder}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="space-y-2 border-y bg-background/60 p-4">
        {items.map((item) => (
          <div key={item.name} className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{item.name}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Pencil className="size-3.5" />
                <X className="size-3.5 text-destructive" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={fakeIconButton}><Minus className="size-3.5" /></div>
                <span className="w-6 text-center text-sm font-medium">1</span>
                <div className={fakeIconButton}><Plus className="size-3.5" /></div>
              </div>
              <p className="text-base font-bold">{item.price} €</p>
            </div>
          </div>
        ))}
      </div>

      {/* PaymentSection */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase">{t.setup.previewTotal}:</span>
          <span className="text-xl font-bold text-amber-500">10.00 €</span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium">{t.setup.previewPaymentMethod} *</p>
          <div className="grid grid-cols-2 overflow-hidden rounded-md border text-xs font-medium">
            <span className="flex h-8 items-center justify-center gap-1.5 border-r">
              <Banknote className="size-3.5" />{t.setup.previewCash}
            </span>
            <span className="flex h-8 items-center justify-center gap-1.5">
              <CreditCard className="size-3.5" />{t.setup.previewCard}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-destructive/80 text-white">
            <Trash2 className="size-4" />
          </div>
          <div className="flex h-9 flex-1 items-center justify-center rounded-md bg-primary/70 text-sm font-semibold text-primary-foreground">
            {t.setup.previewCreateOrder}
          </div>
          <div className={cn(fakeIconButton, "size-9")}>
            <Percent className="size-4" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
