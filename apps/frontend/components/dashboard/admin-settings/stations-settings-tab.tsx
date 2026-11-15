"use client";

import type { SettingsData } from "@mysagra/schemas";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/contexts/locale-context";
import { SettingsSection, type SettingsForm } from "./settings-form";

// "Comande" tab: order preparation (mycomanda monitor) and what the stations get (pickup tickets)
export function StationsSettingsTab({ form, settings }: { form: SettingsForm; settings: SettingsData }) {
  const { t } = useLocale();

  function setPreparation(patch: Partial<SettingsData["preparation"]>) {
    form.setSettings({ ...settings, preparation: { ...settings.preparation, ...patch } });
  }

  function setStations(patch: Partial<SettingsData["stations"]>) {
    form.setSettings({ ...settings, stations: { ...settings.stations, ...patch } });
  }

  return (
    <div className="max-w-3xl divide-y">
      <SettingsSection title={t.adminSettings.monitorSection} hint={t.adminSettings.monitorSectionHint}>
        <SwitchRow
          id="settings-sync-completion"
          label={t.adminSettings.syncCompletionLabel}
          hint={t.adminSettings.syncCompletionHint}
          checked={settings.preparation.syncCompletion}
          onCheckedChange={(syncCompletion) => setPreparation({ syncCompletion })}
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
