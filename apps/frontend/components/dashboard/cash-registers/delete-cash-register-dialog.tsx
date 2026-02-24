"use client";

import { useState } from "react";
import { CashRegister } from "@/lib/api-types";
import { deleteCashRegister } from "@/actions/cash-registers";
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

interface DeleteCashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister: CashRegister | null;
  onDeleted: (id: string) => void;
}

export function DeleteCashRegisterDialog({
  open,
  onOpenChange,
  cashRegister,
  onDeleted,
}: DeleteCashRegisterDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!cashRegister) return;

    setIsLoading(true);
    try {
      await deleteCashRegister(cashRegister.id);
      onDeleted(cashRegister.id);
      toast.success(`Register "${cashRegister.name}" deleted`);
    } catch (error: any) {
      toast.error(error.message || "Error deleting register");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Cash Register</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the register &quot;
            {cashRegister?.name}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
