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
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!printer) return;

    setIsLoading(true);
    try {
      await deletePrinter(printer.id);
      onDeleted(printer.id);
      toast.success(`Printer "${printer.name}" deleted`);
    } catch (error: any) {
      toast.error(error.message || "Error deleting printer");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Printer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the printer &quot;{printer?.name}
            &quot;? This action cannot be undone.
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
