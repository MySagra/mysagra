import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { AdminSidebar } from "./_components/layout/admin-sidebar";
import { Toaster } from "@/components/ui/sonner"

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AdminSidebar variant="inset" />
            <SidebarInset>
                <main>  
                    {children}
                </main>
                <Toaster position="top-center" richColors theme="light" />
            </SidebarInset>
        </SidebarProvider>
    )
}