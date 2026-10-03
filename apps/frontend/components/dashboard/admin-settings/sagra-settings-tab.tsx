"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSettings, type SagraSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/setup/setup-field";
import {
  CashierPreview,
  OrderFieldsControls,
  TicketOption,
  validateCashierSettings,
  type CashierSettingsErrors,
} from "@/components/settings/cashier-settings";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";

const SAGRA_NAME_MAX = 100;

export function SagraSettingsTab({ initial }: { initial: SagraSettings }) {
  const { t } = useLocale();
  // last saved values: the form is dirty when it differs from them
  const [saved, setSaved] = useState(initial);
  const [name, setName] = useState(initial.sagra.name);
  const [settings, setSettings] = useState(initial.settings);
  const [errors, setErrors] = useState<CashierSettingsErrors & { name?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    name !== saved.sagra.name || JSON.stringify(settings) !== JSON.stringify(saved.settings);

  function discard() {
    setName(saved.sagra.name);
    setSettings(saved.settings);
    setErrors({});
  }

  async function save() {
    const found: CashierSettingsErrors & { name?: string } = validateCashierSettings(settings, t);
    if (!name.trim()) found.name = t.setup.sagraRequired;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

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
      return;
    }

    setSaved(result.data);
    setName(result.data.sagra.name);
    setSettings(result.data.settings);
    toast.success(t.adminSettings.toastSaved);
  }

  return (
    // bottom space only while the floating save bar is shown, so the page fits without scrolling
    <div className={cn("grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]", isDirty && "pb-24")}>
      <div className="divide-y">
        <Section title={t.adminSettings.sagraSection} hint={t.adminSettings.sagraSectionHint}>
          <Field label={t.adminSettings.sagraNameLabel} htmlFor="settings-sagra-name" error={errors.name}>
            <Input
              id="settings-sagra-name"
              className="h-10"
              maxLength={SAGRA_NAME_MAX}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              aria-invalid={!!errors.name}
            />
          </Field>
        </Section>

        <Section title={t.adminSettings.ordersSection} hint={t.adminSettings.ordersSectionHint}>
          <OrderFieldsControls
            settings={settings}
            errors={errors}
            onChange={(next) => {
              setSettings(next);
              setErrors((prev) => ({ name: prev.name }));
            }}
          />
        </Section>

        <Section title={t.adminSettings.pickupSection} hint={t.adminSettings.pickupSectionHint}>
          <TicketOption settings={settings} onChange={setSettings} />
        </Section>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start" aria-label={t.adminSettings.previewTitle}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.adminSettings.previewTitle}</p>
        <CashierPreview settings={settings} />
      </aside>

      {/* Save bar: only while there are unsaved changes */}
      {isDirty && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-sm font-medium">{t.adminSettings.unsaved}</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={discard} disabled={isSaving}>
                {t.adminSettings.discard}
              </Button>
              <Button onClick={save} disabled={isSaving}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {isSaving ? t.adminSettings.saving : t.adminSettings.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
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
