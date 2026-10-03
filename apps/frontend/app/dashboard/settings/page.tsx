import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SettingsHub } from "@/components/dashboard/admin-settings/settings-hub";
import { SETTINGS_TABS, type SettingsTab } from "@/components/dashboard/admin-settings/settings-tabs";
import { getSettings, type SagraSettings } from "@/actions/settings";
import { getRoles, getUsers } from "@/actions/users";
import { getApiKeys } from "@/actions/api-keys";
import type { ApiKey, Role, User } from "@/lib/api-types";
import { getSession } from "@/lib/auth";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();

  // sagra settings, users and API keys are admin only (backend rules match)
  if (session?.user.role !== "admin") {
    redirect("/dashboard/account");
  }

  const { tab: requestedTab } = await searchParams;
  const tab: SettingsTab = SETTINGS_TABS.includes(requestedTab as SettingsTab)
    ? (requestedTab as SettingsTab)
    : "sagra";

  // each source fails on its own: a broken one doesn't hide the other tabs
  async function load<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (isRedirectError(error)) throw error;
      return fallback;
    }
  }

  const [settings, users, roles, apiKeys] = await Promise.all([
    load<SagraSettings | null>(getSettings, null),
    load<User[]>(getUsers, []),
    load<Role[]>(getRoles, []),
    load<ApiKey[]>(getApiKeys, []),
  ]);

  return (
    <>
      <DashboardHeader navKey="settings" />
      <SettingsHub
        tab={tab}
        settings={settings}
        // the signed-in admin manages their own account from /dashboard/account
        users={users.filter((u) => u.id !== session.user.id)}
        roles={roles}
        apiKeys={apiKeys}
      />
    </>
  );
}
