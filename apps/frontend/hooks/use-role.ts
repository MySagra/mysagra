"use client";

import { useSession } from "next-auth/react";

export type AppRole = "admin" | "maintainer";

export function useRole() {
  const { data: session } = useSession();
  const role = (session?.user?.role as AppRole | undefined) ?? null;

  return {
    role,
    isAdmin: role === "admin",
    isMaintainer: role === "maintainer",
    // Destructive operations — admin only
    canDelete: role === "admin",
    // Full CRUD on master data — admin only
    canManageUsers: role === "admin",
    canViewCategories: role === "admin" || role === "maintainer",
    canEditCategories: role === "admin" || role === "maintainer",
    canManageCategories: role === "admin",
    // Create/delete printers — admin only
    canCreatePrinters: role === "admin",
    canCreateCashRegisters: role === "admin",
    // Edit full printer record (PUT) — admin only; PATCH (status) is shared
    canEditPrinters: role === "admin",
    // API Keys management — admin only
    canManageApiKeys: role === "admin",
  };
}
