"use client";

import type { SettingsData } from "@mysagra/schemas";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/contexts/locale-context";
import { SettingsSection, type SettingsForm } from "./settings-form";

// How the stations (mycomanda monitor, pickup tickets on the printer) handle the orders they prepare
export function StationsSettingsTab({ form, settings }: { form: SettingsForm; settings: SettingsData }) {
  const { t } = useLocale();

  function setStations(patch: Partial<SettingsData["stations"]>) {
    form.setSettings({ ...settings, stations: { ...settings.stations, ...patch } });
  }

  return (
    <div className="max-w-3xl divide-y">
      <SettingsSection title={t.adminSettings.monitorSection} hint={t.adminSettings.monitorSectionHint}>
        <SwitchRow
          id="settings-auto-complete"
          label={t.adminSettings.autoCompleteLabel}
          hint={t.adminSettings.autoCompleteHint}
          checked={settings.stations.autoComplete}
          onCheckedChange={(autoComplete) => setStations({ autoComplete })}
        />
      </SettingsSection>

      <SettingsSection title={t.adminSettings.printSection} hint={t.adminSettings.printSectionHint}>
        <SwitchRow
          id="settings-pickup-tickets"
          label={t.adminSettings.pickupTicketsLabel}
          hint={t.adminSettings.pickupTicketsHint}
          checked={settings.stations.pickupTickets}
          onCheckedChange={(pickupTickets) => setStations({ pickupTickets })}
        />
      </SettingsSection>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4">
      <label htmlFor={id} className="cursor-pointer space-y-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </label>
      <Switch id={id} className="mt-0.5" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
