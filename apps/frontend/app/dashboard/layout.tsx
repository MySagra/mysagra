import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSession } from "@/lib/auth";
import { Metadata } from "next";
import { DashboardLayoutSkeleton } from "@/components/dashboard/layout-skeleton";
import { SidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { SettingsDataSchema, type SettingsData } from "@mysagra/schemas";
import { getSettings } from "@/actions/settings";
import { SagraSettingsProvider } from "@/contexts/sagra-settings-context";

export const metadata: Metadata = {
  title: "MyAmministratore - Dashboard",
  description: "Pannello di amministrazione MySagra",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  const user = {
    name: session?.user?.name ?? "Admin",
    email: session?.user?.email ?? "",
    avatar: "",
  };
  const role = (session?.user?.role as "admin" | "maintainer" | "operator" | null) ?? null;

  // sagra settings (currency, time zone, ...) for every page; defaults if they can't be loaded
  let settings: SettingsData;
  try {
    settings = (await getSettings()).settings;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    settings = SettingsDataSchema.parse({});
  }

  return (
    <SagraSettingsProvider settings={settings}>
    <TooltipProvider>
      <SidebarProvider>
        <SidebarWrapper user={user} userRole={role} />
        <SidebarInset>
          <Suspense fallback={<DashboardLayoutSkeleton />}>
            {children}
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
    </SagraSettingsProvider>
  );
}
