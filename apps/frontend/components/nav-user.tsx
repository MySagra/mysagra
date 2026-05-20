"use client"

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
import { Badge } from "@/components/ui/badge"
import { ChevronsUpDownIcon, LogOutIcon, LanguagesIcon, CheckIcon, MoonIcon, SunIcon } from "lucide-react"
import { useLocale } from "@/contexts/locale-context"
import { useTheme } from "next-themes"
import type { Locale } from "@/lib/i18n"

type AppRole = "admin" | "maintainer" | "operator" | null

const roleBadgeClass: Record<NonNullable<AppRole>, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
  maintainer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  operator: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
}

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
            >
              <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} className="rounded-lg" />
                <AvatarFallback className="rounded-lg">{initials || "AD"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {role && (
                  <Badge variant="outline" className={`w-fit mt-0.5 text-[10px] px-1.5 py-0 leading-4 font-medium capitalize ${roleBadgeClass[role]}`}>
                    {role}
                  </Badge>
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
                  <Badge variant="outline" className={`w-fit mt-0.5 text-[10px] px-1.5 py-0 leading-4 font-medium capitalize ${roleBadgeClass[role]}`}>
                    {role}
                  </Badge>
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
