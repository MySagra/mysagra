"use client";

import { useState } from "react";
import { Printer } from "@/lib/api-types";
import { deletePrinter } from "@/actions/printers";
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

interface DeletePrinterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printer: Printer | null;
  onDeleted: (id: string) => void;
}

export function DeletePrinterDialog({
  open,
  onOpenChange,
  printer,
  onDeleted,
}: DeletePrinterDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!printer) return;
    setIsLoading(true);
    const result = await deletePrinter(printer.id);
    setIsLoading(false);
    if (!result.ok) { toast.error(result.error); return; }
    onDeleted(printer.id);
    toast.success(`"${printer.name}" ${t.printers.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.printers.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.printers.deleteDescription} &quot;{printer?.name}&quot;? {t.printers.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? t.printers.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
