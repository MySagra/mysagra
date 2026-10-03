"use client"

import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { RoleBadge } from "@/components/role-badge"
import { ChevronsUpDownIcon, LogOutIcon, LanguagesIcon, CheckIcon, MoonIcon, SunIcon, SettingsIcon } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"
import { useTheme } from "next-themes"
import type { Locale } from "@/lib/i18n"

type AppRole = "admin" | "maintainer" | "operator" | null

const LOCALES: { value: Locale; flag: string }[] = [
  { value: "it", flag: "🇮🇹" },
  { value: "en", flag: "🇬🇧" },
]

export function NavUser({
  user,
  role,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  role?: AppRole
}) {
  const { isMobile } = useSidebar()
  const { locale, setLocale, t } = useLocale()
  const { theme, setTheme } = useTheme()

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function handleLogout() {
    window.location.href = "/api/auth/force-logout"
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              suppressHydrationWarning
            >
              <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} className="rounded-lg" />
                <AvatarFallback className="rounded-lg">{initials || "AD"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {role && (
                  <RoleBadge role={role} className="mt-0.5" />
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg">{initials || "AD"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  {role && (
                  <RoleBadge role={role} className="mt-0.5" />
                )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <LanguagesIcon className="size-4" />
                {t.language.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {LOCALES.map(({ value, flag }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setLocale(value)}
                    className="gap-2"
                  >
                    <span>{flag}</span>
                    <span>{t.language[value]}</span>
                    {locale === value && (
                      <CheckIcon className="ml-auto size-3.5 opacity-70" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account">
                <SettingsIcon className="size-4" />
                {t.nav.account}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              {t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
