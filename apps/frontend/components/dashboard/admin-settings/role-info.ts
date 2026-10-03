"use client";

import { useLocale } from "@/contexts/locale-context";

// Labels and descriptions for the roles. They describe the real permissions of each role:
// keep them in sync with the backend `authenticate([...])` rules and proxy.ts.
export function useRoleInfo() {
  const { t } = useLocale();

  const info: Record<string, { label: string; hint: string }> = {
    admin: { label: t.adminSettings.roleAdmin, hint: t.adminSettings.roleAdminHint },
    maintainer: { label: t.adminSettings.roleMaintainer, hint: t.adminSettings.roleMaintainerHint },
    operator: { label: t.adminSettings.roleOperator, hint: t.adminSettings.roleOperatorHint },
  };

  return (roleName: string) => info[roleName] ?? { label: roleName, hint: "" };
}
