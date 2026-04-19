"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/api-types";
import { deleteIngredient } from "@/actions/ingredients";
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

interface DeleteIngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
  onDeleted: (id: string) => void;
}

export function DeleteIngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onDeleted,
}: DeleteIngredientDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!ingredient) return;
    setIsLoading(true);
    const result = await deleteIngredient(ingredient.id);
    setIsLoading(false);
    if (!result.ok) { toast.error(result.error); return; }
    onDeleted(ingredient.id);
    toast.success(`"${ingredient.name}" ${t.ingredients.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.ingredients.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.ingredients.deleteDescription} &quot;
            {ingredient?.name}&quot;? {t.ingredients.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.ingredients.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
