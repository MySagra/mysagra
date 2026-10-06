"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SettingsData } from "@mysagra/schemas";
import { updateSettings, type SagraSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { validateCashierSettings, type CashierSettingsErrors } from "@/components/settings/cashier-settings";
import { validateOrderingSettings, type OrderingSettingsErrors } from "@/components/settings/ordering-settings";
import { useLocale } from "@/contexts/locale-context";

export type SettingsFormErrors = CashierSettingsErrors & OrderingSettingsErrors & { name?: string };

// The general and cash desk tabs edit one settings document, saved with a single PUT:
// they share this form state, so saving one tab never sends stale values of the other.
export function useSettingsForm(initial: SagraSettings | null) {
  const { t } = useLocale();
  // last saved values: the form is dirty when it differs from them
  const [saved, setSaved] = useState(initial);
  const [name, setNameState] = useState(initial?.sagra.name ?? "");
  const [settings, setSettings] = useState<SettingsData | null>(initial?.settings ?? null);
  const [errors, setErrors] = useState<SettingsFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    !!saved && (name !== saved.sagra.name || JSON.stringify(settings) !== JSON.stringify(saved.settings));

  function setName(value: string) {
    setNameState(value);
    setErrors((prev) => ({ ...prev, name: undefined }));
  }

  // fields are edited one at a time: clear the errors they may have fixed
  function changeSettings(next: SettingsData) {
    setSettings(next);
    setErrors((prev) => ({ name: prev.name }));
  }

  function discard() {
    if (!saved) return;
    setNameState(saved.sagra.name);
    setSettings(saved.settings);
    setErrors({});
  }

  // returns the errors found, so the caller can show the tab that holds them
  async function save(): Promise<SettingsFormErrors> {
    if (!settings) return {};

    const found: SettingsFormErrors = {
      ...validateCashierSettings(settings, t),
      ...validateOrderingSettings(settings, t),
    };
    if (!name.trim()) found.name = t.setup.sagraRequired;
    setErrors(found);
    if (Object.keys(found).length > 0) return found;

    const { orders } = settings;
    setIsSaving(true);
    const result = await updateSettings({
      sagra: { name: name.trim() },
      settings: {
        ...settings,
        orders: {
          ...orders,
          // the highest table number only makes sense when the table is a number
          maxTables: orders.table !== "HIDDEN" && orders.tableInputs.includes("NUMBER") ? orders.maxTables : null,
        },
      },
    });
    setIsSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return {};
    }

    setSaved(result.data);
    setNameState(result.data.sagra.name);
    setSettings(result.data.settings);
    toast.success(t.adminSettings.toastSaved);
    return {};
  }

  return { name, setName, settings, setSettings: changeSettings, errors, isDirty, isSaving, save, discard };
}

export type SettingsForm = ReturnType<typeof useSettingsForm>;

// Floating bar shown while there are unsaved changes, whichever tab is open
export function SettingsSaveBar({ form, onSave }: { form: SettingsForm; onSave: () => void }) {
  const { t } = useLocale();
  if (!form.isDirty) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-sm font-medium">{t.adminSettings.unsaved}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={form.discard} disabled={form.isSaving}>
            {t.adminSettings.discard}
          </Button>
          <Button onClick={onSave} disabled={form.isSaving}>
            {form.isSaving && <Loader2 className="size-4 animate-spin" />}
            {form.isSaving ? t.adminSettings.saving : t.adminSettings.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Settings row: title and hint on the left, fields on the right
export function SettingsSection({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
