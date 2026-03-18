"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutGridIcon,
  UtensilsCrossedIcon,
  ClipboardListIcon,
  Wheat,
  PrinterIcon,
  UsersIcon,
  Coins,
  HomeIcon,
  LifeBuoyIcon,
  Github,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useLocale } from "@/contexts/locale-context"
import { useRole } from "@/hooks/use-role"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const { t } = useLocale()
  const { canManageUsers, canManageCategories } = useRole()

  const user = {
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "",
    avatar: "",
  }

  const navItems = {
    home: [
      {
        title: t.nav.home,
        url: "/dashboard",
        icon: HomeIcon,
      },
    ],
    cucina: [
      ...(canManageCategories
        ? [{ title: t.nav.categories, url: "/dashboard/categories", icon: LayoutGridIcon }]
        : []),
      {
        title: t.nav.foods,
        url: "/dashboard/foods",
        icon: UtensilsCrossedIcon,
      },
      {
        title: t.nav.ingredients,
        url: "/dashboard/ingredients",
        icon: Wheat,
      },
    ],
    ordini: [
      {
        title: t.nav.orders,
        url: "/dashboard/orders",
        icon: ClipboardListIcon,
      },
    ],
    gestione: [
      {
        title: t.nav.cashRegisters,
        url: "/dashboard/cash-registers",
        icon: Coins,
      },
      {
        title: t.nav.printers,
        url: "/dashboard/printers",
        icon: PrinterIcon,
      },
      ...(canManageUsers
        ? [{ title: t.nav.users, url: "/dashboard/users", icon: UsersIcon }]
        : []),
    ],
    navSecondary: [
      {
        title: t.nav.support,
        url: "https://mysagra.com/#professional-services",
        icon: LifeBuoyIcon,
      },
      {
        title: "GitHub",
        url: "https://github.com/MySagra",
        icon: Github,
      },
    ],
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-16 items-center justify-center rounded-lg overflow-hidden">
                  <img src="/icona.png" alt="MySagra Logo" className="object-contain p-2 w-full h-full" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-2xl">MySagra</span>
                  <span className="truncate text-xs">MyAmministratore</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems.home} />
        <NavMain items={navItems.cucina} label={t.nav.kitchen} />
        <div className="my-2">
          <NavMain items={navItems.ordini} />
        </div>
        <NavMain items={navItems.gestione} label={t.nav.management} />
        <NavSecondary items={navItems.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <ThemeSwitcher />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
