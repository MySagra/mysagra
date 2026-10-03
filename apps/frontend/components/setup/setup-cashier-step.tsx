"use client";

import type { SettingsData } from "@mysagra/schemas";
import { useLocale } from "@/contexts/locale-context";
import { CashierPreview, OrderFieldsControls, TicketOption, type CashierSettingsErrors } from "@/components/settings/cashier-settings";

interface SetupCashierStepProps {
  settings: SettingsData;
  errors: CashierSettingsErrors;
  onChange: (settings: SettingsData) => void;
}

export function SetupCashierStep({ settings, errors, onChange }: SetupCashierStepProps) {
  const { t } = useLocale();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.setup.cashierTitle}</h1>
          <p className="text-muted-foreground">{t.setup.cashierDescription}</p>
        </div>

        <OrderFieldsControls settings={settings} errors={errors} onChange={onChange} />
        <TicketOption settings={settings} onChange={onChange} />
      </div>

      <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start" aria-label={t.setup.previewTitle}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.setup.previewTitle}</p>
        <CashierPreview settings={settings} />
      </aside>
    </div>
  );
}
