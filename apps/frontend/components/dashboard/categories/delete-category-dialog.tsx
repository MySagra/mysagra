"use client";

import { useState } from "react";
import { Category } from "@/lib/api-types";
import { deleteCategory } from "@/actions/categories";
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

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onDeleted: (id: string) => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onDeleted,
}: DeleteCategoryDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!category) return;

    setIsLoading(true);
    try {
      await deleteCategory(category.id);
      onDeleted(category.id);
      toast.success(`"${category.name}" ${t.categories.toastDeleted}`);
    } catch (error: any) {
      toast.error(error.message || t.categories.toastErrorDelete);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.categories.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.categories.deleteDescription} &quot;{category?.name}&quot;? {t.categories.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.categories.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
