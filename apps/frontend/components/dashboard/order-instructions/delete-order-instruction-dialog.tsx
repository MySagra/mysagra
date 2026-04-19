"use client";

import { useState } from "react";
import { OrderInstruction } from "@/lib/api-types";
import { deleteOrderInstruction } from "@/actions/order-instructions";
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

interface DeleteOrderInstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: OrderInstruction | null;
  onDeleted: (id: string) => void;
}

export function DeleteOrderInstructionDialog({
  open,
  onOpenChange,
  instruction,
  onDeleted,
}: DeleteOrderInstructionDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!instruction) return;
    setIsLoading(true);
    const result = await deleteOrderInstruction(instruction.id);
    setIsLoading(false);
    if (!result.ok) { toast.error(result.error); return; }
    onDeleted(instruction.id);
    toast.success(`"${instruction.text.substring(0, 30)}${instruction.text.length > 30 ? '...' : ''}" ${t.orderInstructions.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.orderInstructions.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.orderInstructions.deleteDescription} &quot;{instruction?.text.substring(0, 50)}{(instruction?.text.length ?? 0) > 50 ? '...' : ''}&quot;? {t.orderInstructions.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.orderInstructions.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
