"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
  KeyRoundIcon,
  ImageIcon,
  ListOrderedIcon,
  BarChart3,
} from "lucide-react"
import { useLocale } from "@/contexts/locale-context"

type AppRole = "admin" | "maintainer" | null

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; avatar: string }
  userRole: AppRole
}

export function AppSidebar({ user, userRole, ...props }: AppSidebarProps) {
  const { t } = useLocale()

  const isAdmin = userRole === "admin"
  const isMaintainer = userRole === "maintainer"

  const navItems = {
    home: [
      {
        title: t.nav.home,
        url: "/dashboard",
        icon: HomeIcon,
      },
      ...(isAdmin || isMaintainer
        ? [{
            title: t.nav.analytics,
            url: "/dashboard/analytics",
            icon: BarChart3,
          }]
        : []),
    ],
    cucina: [
      ...(isAdmin || isMaintainer
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
    customerExperience: [
      ...(isAdmin || isMaintainer
        ? [{ title: t.nav.banners, url: "/dashboard/banners", icon: ImageIcon }]
        : []),
      ...(isAdmin || isMaintainer
        ? [{ title: t.nav.orderInstructions, url: "/dashboard/order-instructions", icon: ListOrderedIcon }]
        : []),
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
      ...(isAdmin
        ? [{ title: t.nav.users, url: "/dashboard/users", icon: UsersIcon }]
        : []),
      ...(isAdmin
        ? [{ title: t.nav.apiKeys, url: "/dashboard/api-keys", icon: KeyRoundIcon }]
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
        {navItems.customerExperience.length > 0 && (
          <NavMain items={navItems.customerExperience} label={t.nav.customerExperience} />
        )}
        <NavMain items={navItems.gestione} label={t.nav.management} />
        <NavSecondary items={navItems.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
