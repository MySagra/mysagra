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
import { useLocale } from "@/contexts/locale-context";

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
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!cashRegister) return;

    setIsLoading(true);
    try {
      await deleteCashRegister(cashRegister.id);
      onDeleted(cashRegister.id);
      toast.success(`"${cashRegister.name}" ${t.cashRegisters.toastDeleted}`);
    } catch (error: any) {
      toast.error(error.message || t.cashRegisters.toastErrorDelete);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.cashRegisters.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.cashRegisters.deleteDescription} &quot;
            {cashRegister?.name}&quot;? {t.cashRegisters.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? t.cashRegisters.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
