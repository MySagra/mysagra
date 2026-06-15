"use client";

import { useSession } from "@/hooks/use-session";

export type AppRole = "admin" | "maintainer" | "operator";

export function useRole() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role as AppRole | undefined) ?? null;

  return {
    role,
    isSessionLoading: status === "loading",
    isAdmin: role === "admin",
    isMaintainer: role === "maintainer",
    isOperator: role === "operator",
    isReadOnly: role === "operator",
    // Destructive operations — admin only
    canDelete: role === "admin",
    // Full CRUD on master data — admin only
    canManageUsers: role === "admin",
    canViewCategories: role === "admin" || role === "maintainer" || role === "operator",
    canEditCategories: role === "admin" || role === "maintainer",
    canManageCategories: role === "admin",
    // Create/delete printers — admin only
    canCreatePrinters: role === "admin",
    canCreateCashRegisters: role === "admin",
    // Edit full printer record (PUT) — admin only; PATCH (status) is shared
    canEditPrinters: role === "admin",
    // API Keys management — admin only
    canManageApiKeys: role === "admin",
    // Banners — admin and maintainer can create/edit/delete
    canManageBanners: role === "admin" || role === "maintainer",
    // Order Instructions — admin and maintainer can create/edit/delete/reorder
    canManageOrderInstructions: role === "admin" || role === "maintainer",
  };
}
