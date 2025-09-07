"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"

export function NavUser({
    user,
}: {
    user: {
        username: string
        role: string
    }
}) {
    const router = useRouter();
    const { isMobile } = useSidebar();
    const t = useTranslations('Utils');

    function logOut() {
        fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        }).then(() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            router.replace("/login");
        });
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem className="flex flex-row gap-3 items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={"#"} alt={user.username} />
                                <AvatarFallback className="rounded-lg">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{`@${user.username}`}</span>
                                <span className="truncate text-xs">{user.role}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
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
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={"#"} alt={user.username} />
                                    <AvatarFallback className="rounded-lg">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{`@${user.username}`}</span>
                                    <span className="truncate text-xs">{user.role}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logOut()}>
                            <LogOut />
                            {t('logout')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
