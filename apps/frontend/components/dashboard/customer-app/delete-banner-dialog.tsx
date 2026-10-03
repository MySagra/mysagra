"use client";

import { useState } from "react";
import { Banner } from "@/lib/api-types";
import { deleteBanner } from "@/actions/banners";
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

interface DeleteBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  onDeleted: (id: string) => void;
}

export function DeleteBannerDialog({
  open,
  onOpenChange,
  banner,
  onDeleted,
}: DeleteBannerDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!banner) return;
    setIsLoading(true);
    const result = await deleteBanner(banner.id);
    setIsLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onDeleted(banner.id);
    toast.success(`"${banner.label}" ${t.banners.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.banners.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.banners.deleteDescription} &quot;{banner?.label}&quot;? {t.banners.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.banners.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
