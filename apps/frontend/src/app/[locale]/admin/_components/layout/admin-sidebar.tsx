"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"

import { Gauge, Pizza, Receipt, Martini, Users, ArrowLeftRight } from "lucide-react"
import Logo from "@/components/logo"
import { NavUser } from "./nav-user"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

    const t = useTranslations('Utils');

    const data = {
        navMain: [
            {
                title: t('dashboard'),
                url: "/admin/dashboard",
                icon: Gauge,
            },
            {
                title: t('users'),
                url: "/admin/users",
                icon: Users,
            },
            {
                title: t('categories'),
                url: "/admin/categories",
                icon: Martini,
            },
            {
                title: t('foods'),
                url: "/admin/food",
                icon: Pizza,
            },
            {
                title: t('orders'),
                url: "/admin/orders/1",
                icon: Receipt,
            },
            {
                title: t('operatorView'),
                url: "/operator/dashboard",
                icon: ArrowLeftRight,
            }
        ]
    }

    const [user, setUser] = useState({ username: "", role: "" });

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        setUser(JSON.parse(userStr));
    }, [])

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <a href="#">
                                <Logo className="!size-5" />
                                <span className="text-base font-semibold text-primary">{process.env.NEXT_PUBLIC_APP_NAME}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}