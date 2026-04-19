"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/api-types";
import { deleteUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/locale-context";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onDeleted: (id: string) => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onDeleted,
}: DeleteUserDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDelete() {
    if (!user) return;

    setIsLoading(true);
    const result = await deleteUser(user.id);
    setIsLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onDeleted(user.id);
    toast.success(`"${user.username}" ${t.users.toastDeleted}`);
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0 duration-150"
        onClick={() => !isLoading && onOpenChange(false)}
      />
      {/* Dialog */}
      <div className="relative z-101 bg-background ring-foreground/10 ring-1 rounded-xl p-4 w-full max-w-xs sm:max-w-sm mx-4 animate-in fade-in-0 zoom-in-95 duration-150 grid gap-4">
        <div className="grid gap-1.5">
          <h2 className="text-base font-medium">{t.users.deleteTitle}</h2>
          <p className="text-muted-foreground text-sm">
            {t.users.deleteDescription} &quot;{user?.username}&quot;? {t.users.deleteCannotUndo}
          </p>
        </div>
        <div className="bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? t.users.deleting : t.common.delete}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
