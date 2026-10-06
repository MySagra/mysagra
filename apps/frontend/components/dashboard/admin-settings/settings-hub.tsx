"use client";

import { useCallback, useRef, useState } from "react";
import { KeyRoundIcon, ShoppingCartIcon, SlidersHorizontalIcon, UsersIcon, type LucideIcon } from "lucide-react";
import type { SagraSettings } from "@/actions/settings";
import { ApiKeysContent } from "@/components/dashboard/api-keys/api-keys-content";
import { useLocale } from "@/contexts/locale-context";
import type { ApiKey, Role, User } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { CashierSettingsTab } from "./cashier-settings-tab";
import { GeneralSettingsTab } from "./general-settings-tab";
import { SettingsSaveBar, useSettingsForm, type SettingsFormErrors } from "./settings-form";
import { SETTINGS_TABS, type SettingsTab } from "./settings-tabs";
import { UsersTab } from "./users-tab";

interface SettingsHubProps {
  tab: SettingsTab;
  // null when the settings could not be loaded
  settings: SagraSettings | null;
  users: User[];
  roles: Role[];
  apiKeys: ApiKey[];
}

export function SettingsHub({ tab, settings, users, roles, apiKeys }: SettingsHubProps) {
  const { t } = useLocale();
  const [active, setActive] = useState<SettingsTab>(tab);
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement | null>>>({});
  // counters next to the tab labels, kept in sync by the tabs themselves
  const [userCount, setUserCount] = useState(users.length);
  const [apiKeyCount, setApiKeyCount] = useState(apiKeys.filter((k) => !k.revokedAt).length);
  const onUserCount = useCallback((n: number) => setUserCount(n), []);
  const onApiKeyCount = useCallback((n: number) => setApiKeyCount(n), []);
  // one form for the general and cash desk tabs (same settings document, single save)
  const form = useSettingsForm(settings);

  const tabs: Record<SettingsTab, { label: string; icon: LucideIcon; count?: number }> = {
    general: { label: t.adminSettings.tabGeneral, icon: SlidersHorizontalIcon },
    cashier: { label: t.adminSettings.tabCashier, icon: ShoppingCartIcon },
    users: { label: t.adminSettings.tabUsers, icon: UsersIcon, count: userCount },
    "api-keys": { label: t.adminSettings.tabApiKeys, icon: KeyRoundIcon, count: apiKeyCount },
  };

  // The tab lives in the URL (?tab=users) for links and reloads, but switching doesn't hit the server:
  // all tabs stay mounted, so unsaved edits survive a tab change.
  function select(next: SettingsTab) {
    setActive(next);
    const url = new URL(window.location.href);
    if (next === "general") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  // the save button may be pressed from either tab: show the one holding the errors
  async function save() {
    const errors: SettingsFormErrors = await form.save();
    if (errors.name || errors.closesAt) select("general");
    else if (errors.tableInputs || errors.maxTables) select("cashier");
  }

  // arrow keys move between tabs (WAI-ARIA tabs pattern)
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const index = SETTINGS_TABS.indexOf(active);
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const next = SETTINGS_TABS[(index + delta + SETTINGS_TABS.length) % SETTINGS_TABS.length];
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="flex flex-1 flex-col p-4 pt-0">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">{t.adminSettings.title}</h1>

        {/* GitHub-like tab bar: icon, label and counter, hover pill on the label, flat underline on the active tab */}
        <div role="tablist" aria-label={t.adminSettings.title} className="flex gap-2 border-b" onKeyDown={onKeyDown}>
          {SETTINGS_TABS.map((value) => {
            const selected = active === value;
            const { label, icon: Icon, count } = tabs[value];
            return (
              <button
                key={value}
                ref={(el) => { tabRefs.current[value] = el; }}
                type="button"
                role="tab"
                id={`settings-tab-${value}`}
                aria-selected={selected}
                aria-controls={`settings-panel-${value}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(value)}
                className={cn(
                  "group relative pb-2 text-sm outline-none",
                  // flat (not rounded) underline, as wide as the tab, over the bar border
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5",
                  selected ? "font-semibold text-foreground after:bg-primary" : "text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors group-hover:bg-muted group-hover:text-foreground group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <Icon className="size-4" />
                  {label}
                  {count !== undefined && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-xs font-medium tabular-nums text-muted-foreground group-hover:bg-background">
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <TabPanel value="general" active={active}>
          {form.settings ? <GeneralSettingsTab form={form} settings={form.settings} /> : <LoadError />}
        </TabPanel>

        <TabPanel value="cashier" active={active}>
          {form.settings ? <CashierSettingsTab form={form} settings={form.settings} /> : <LoadError />}
        </TabPanel>

        <TabPanel value="users" active={active}>
          <UsersTab initialUsers={users} roles={roles} onCountChange={onUserCount} />
        </TabPanel>

        {/* existing API keys screen, reused as is: drop its page padding and width limit */}
        <TabPanel value="api-keys" active={active} className="[&>div]:p-0 [&>div>div]:max-w-none">
          <ApiKeysContent initialApiKeys={apiKeys} onActiveCountChange={onApiKeyCount} />
        </TabPanel>

        {/* bottom space while the floating save bar covers the end of the page */}
        {form.isDirty && <div aria-hidden className="h-20" />}
      </div>

      <SettingsSaveBar form={form} onSave={save} />
    </div>
  );
}

function LoadError() {
  const { t } = useLocale();
  return <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{t.adminSettings.loadError}</p>;
}

function TabPanel({
  value,
  active,
  className,
  children,
}: {
  value: SettingsTab;
  active: SettingsTab;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`settings-panel-${value}`}
      aria-labelledby={`settings-tab-${value}`}
      hidden={active !== value}
      className={className}
    >
      {children}
    </div>
  );
}
