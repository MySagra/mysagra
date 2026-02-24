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
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!food) return;

    setIsLoading(true);
    try {
      await deleteFood(food.id);
      onDeleted(food.id);
      toast.success(`"${food.name}" deleted`);
    } catch (error: any) {
      toast.error(error.message || "Error deleting food");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Food</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{food?.name}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
