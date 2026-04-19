"use client";

import { useState } from "react";
import { Food } from "@/lib/api-types";
import { deleteFood } from "@/actions/foods";
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

interface DeleteFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: Food | null;
  onDeleted: (id: string) => void;
}

export function DeleteFoodDialog({
  open,
  onOpenChange,
  food,
  onDeleted,
}: DeleteFoodDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!food) return;
    setIsLoading(true);
    const result = await deleteFood(food.id);
    setIsLoading(false);
    if (!result.ok) { toast.error(result.error); return; }
    onDeleted(food.id);
    toast.success(`"${food.name}" ${t.foods.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.foods.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.foods.deleteDescription} &quot;{food?.name}&quot;? {t.foods.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.foods.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
