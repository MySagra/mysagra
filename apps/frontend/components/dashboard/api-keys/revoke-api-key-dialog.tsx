"use client";

import { useState } from "react";
import { ApiKey } from "@/lib/api-types";
import { revokeApiKey } from "@/actions/api-keys";
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

interface RevokeApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKey | null;
  onRevoked: (id: string) => void;
}

export function RevokeApiKeyDialog({
  open,
  onOpenChange,
  apiKey,
  onRevoked,
}: RevokeApiKeyDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleRevoke() {
    if (!apiKey) return;

    setIsLoading(true);
    try {
      await revokeApiKey(apiKey.id);
      onRevoked(apiKey.id);
      toast.success(`"${apiKey.name}" ${t.apiKeys.toastRevoked}`);
    } catch (error: any) {
      toast.error(error.message || t.apiKeys.toastErrorRevoke);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.apiKeys.revokeTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.apiKeys.revokeDescription} &quot;{apiKey?.name}&quot;?{" "}
            {t.apiKeys.revokeCannotUndo}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? t.apiKeys.revoking : t.apiKeys.revokeButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
