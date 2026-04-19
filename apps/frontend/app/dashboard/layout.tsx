import { Suspense } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { DashboardLayoutSkeleton } from "@/components/dashboard/layout-skeleton";
import { SidebarWrapper } from "@/components/dashboard/sidebar-wrapper";

export const metadata: Metadata = {
  title: "MyAmministratore - Dashboard",
  description: "Pannello di amministrazione MySagra",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const user = {
    name: session?.user?.name ?? "Admin",
    email: session?.user?.email ?? "",
    avatar: "",
  };
  const role = (session?.user?.role as "admin" | "maintainer" | null) ?? null;

  return (
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
  );
}
