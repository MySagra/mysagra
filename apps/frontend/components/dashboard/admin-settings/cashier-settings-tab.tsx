"use client";

import type { SettingsData } from "@mysagra/schemas";
import { CashierPreview, OrderFieldsControls } from "@/components/settings/cashier-settings";
import { useLocale } from "@/contexts/locale-context";
import { SettingsSection, type SettingsForm } from "./settings-form";

// What the cashier fills in, with a live preview of the cash desk
export function CashierSettingsTab({ form, settings }: { form: SettingsForm; settings: SettingsData }) {
  const { t } = useLocale();

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="divide-y">
        <SettingsSection title={t.adminSettings.ordersSection} hint={t.adminSettings.ordersSectionHint}>
          <OrderFieldsControls settings={settings} errors={form.errors} onChange={form.setSettings} />
        </SettingsSection>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start" aria-label={t.adminSettings.previewTitle}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.adminSettings.previewTitle}</p>
        <CashierPreview settings={settings} />
      </aside>
    </div>
  );
}
