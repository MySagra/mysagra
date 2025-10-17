"use client"
import { Button } from "./button"
import { LogOut, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl";
import { useLogout } from "@/hooks/api/auth";

type LogoutButtonProps = {
    className?: string;
    variant?: "destructive" | "default" | "outline" | "secondary" | "ghost" | "edit" | null | undefined;
};

export function LogoutButton({ className, variant = 'destructive' }: LogoutButtonProps) {
    const t = useTranslations('Utils');
    const { mutate: doLogout, isPending } = useLogout();

    function handleLogout() {
        doLogout(undefined, {
            onSuccess: () => {
                try {
                    localStorage.removeItem('user');
                } catch {}
                window.location.href = '/login';
            }
        });
    }

    return (
        <Button variant={variant} onClick={handleLogout} disabled={isPending} className={className}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />} {t('logout')}
        </Button>
    );
}