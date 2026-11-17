"use client";

import { useState } from "react";
import { Display } from "@/lib/api-types";
import { deleteDisplay } from "@/actions/displays";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";

interface DeleteDisplayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  display: Display | null;
  onDeleted: (id: string) => void;
}

export function DeleteDisplayDialog({
  open,
  onOpenChange,
  display,
  onDeleted,
}: DeleteDisplayDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!display) return;
    setIsLoading(true);
    const result = await deleteDisplay(display.id);
    setIsLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onDeleted(display.id);
    toast.success(`"${display.name}" ${t.displays.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.displays.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.displays.deleteDescription} &quot;{display?.name}&quot;? {t.displays.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.displays.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
