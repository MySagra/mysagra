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
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!ingredient) return;

    setIsLoading(true);
    try {
      await deleteIngredient(ingredient.id);
      onDeleted(ingredient.id);
      toast.success(`Ingredient "${ingredient.name}" deleted`);
    } catch (error: any) {
      toast.error(error.message || "Error deleting ingredient");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the ingredient &quot;
            {ingredient?.name}&quot;? This action cannot be undone.
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
