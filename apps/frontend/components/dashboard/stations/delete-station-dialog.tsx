"use client";

import { useState } from "react";
import { Station } from "@/lib/api-types";
import { deleteStation } from "@/actions/stations";
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

interface DeleteStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onDeleted: (id: string) => void;
}

export function DeleteStationDialog({
  open,
  onOpenChange,
  station,
  onDeleted,
}: DeleteStationDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!station) return;
    setIsLoading(true);
    const result = await deleteStation(station.id);
    setIsLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onDeleted(station.id);
    toast.success(`"${station.name}" ${t.stations.toastDeleted}`);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.stations.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.stations.deleteDescription} &quot;{station?.name}&quot;? {t.stations.cannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? t.stations.deleting : t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
