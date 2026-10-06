"use client";

import type { SettingsData } from "@mysagra/schemas";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/setup/setup-field";
import { CurrencyField, TimeZoneField } from "@/components/settings/general-settings";
import { OrderingControls } from "@/components/settings/ordering-settings";
import { OrderIdOption } from "@/components/settings/cashier-settings";
import { useLocale } from "@/contexts/locale-context";
import { SettingsSection, type SettingsForm } from "./settings-form";

const SAGRA_NAME_MAX = 100;

// Sagra name, order identifier, ordering app hours, time zone and currency
export function GeneralSettingsTab({ form, settings }: { form: SettingsForm; settings: SettingsData }) {
  const { t } = useLocale();

  function setGeneral(patch: Partial<SettingsData["general"]>) {
    form.setSettings({ ...settings, general: { ...settings.general, ...patch } });
  }

  return (
    <div className="max-w-3xl divide-y">
      <SettingsSection title={t.adminSettings.sagraSection} hint={t.adminSettings.sagraSectionHint}>
        <Field label={t.adminSettings.sagraNameLabel} htmlFor="settings-sagra-name" error={form.errors.name}>
          <Input
            id="settings-sagra-name"
            className="h-10"
            maxLength={SAGRA_NAME_MAX}
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            aria-invalid={!!form.errors.name}
          />
        </Field>
      </SettingsSection>

      {/* shown by every app and on receipts, not only at the cash desk */}
      <SettingsSection title={t.adminSettings.identifierSection} hint={t.adminSettings.identifierSectionHint}>
        <OrderIdOption settings={settings} onChange={form.setSettings} />
      </SettingsSection>

      <SettingsSection title={t.adminSettings.orderingSection} hint={t.adminSettings.orderingSectionHint}>
        {/* the time zone has its own section above */}
        <OrderingControls settings={settings} errors={form.errors} showTimeZone={false} onChange={form.setSettings} />
      </SettingsSection>

      <SettingsSection title={t.adminSettings.timezoneSection} hint={t.adminSettings.timezoneSectionHint}>
        <TimeZoneField
          id="settings-timezone"
          value={settings.general.timezone}
          onChange={(timezone) => setGeneral({ timezone })}
        />
      </SettingsSection>

      <SettingsSection title={t.adminSettings.currencySection} hint={t.adminSettings.currencySectionHint}>
        <CurrencyField
          id="settings-currency"
          value={settings.general.currency}
          onChange={(currency) => setGeneral({ currency })}
        />
      </SettingsSection>
    </div>
  );
}
