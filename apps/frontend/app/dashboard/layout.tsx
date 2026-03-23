import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { Metadata } from "next";

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
        <AppSidebar user={user} userRole={role} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
