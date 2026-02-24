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


const data = {
  home: [
    {
      title: "Home",
      url: "/dashboard",
      icon: HomeIcon,
    },
  ],
  cucina: [
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: LayoutGridIcon,
    },
    {
      title: "Foods",
      url: "/dashboard/foods",
      icon: UtensilsCrossedIcon,
    },
    {
      title: "Ingredients",
      url: "/dashboard/ingredients",
      icon: Wheat,
    },
  ],
  ordini: [
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ClipboardListIcon,
    },
  ],
  gestione: [
    {
      title: "Cash Registers",
      url: "/dashboard/cash-registers",
      icon: Coins,
    },
    {
      title: "Printers",
      url: "/dashboard/printers",
      icon: PrinterIcon,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: UsersIcon,
    },
  ],
  navSecondary: [
    {
      title: "Support",
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const user = {
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "",
    avatar: "",
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
        <NavMain items={data.home} />
        <NavMain items={data.cucina} label="Kitchen" />
        <div className="my-2">
          <NavMain items={data.ordini} />
        </div>
        <NavMain items={data.gestione} label="Management" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <ThemeSwitcher />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
