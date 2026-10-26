"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteReceiptLogo, uploadReceiptLogo } from "@/actions/settings";
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
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import { ReceiptLogoEditor } from "./receipt-logo-editor";

// SVG too: it's rasterised in the browser, the backend receives a PNG
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/svg+xml"];
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

// "/uploads/receipt_logo/x.png" (backend) -> served by the frontend images proxy
function logoUrl(receiptLogo: string | null): string | null {
  return receiptLogo ? receiptLogo.replace(/^\/uploads\//, "/api/images/") : null;
}

// Receipt logo: saved right away, independent of the settings save bar
export function ReceiptLogoField({ receiptLogo }: { receiptLogo: string | null }) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(() => logoUrl(receiptLogo));
  const [source, setSource] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // free the object URL of the chosen file when the editor closes
  useEffect(() => {
    if (!source) return;
    return () => URL.revokeObjectURL(source);
  }, [source]);

  function pick(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(t.adminSettings.receiptLogoInvalidType);
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error(t.adminSettings.receiptLogoTooLarge);
      return;
    }
    setSource(URL.createObjectURL(file));
  }

  const closeEditor = useCallback(() => setSource(null), []);

  async function upload(file: File): Promise<boolean> {
    const formData = new FormData();
    formData.append("image", file);
    const result = await uploadReceiptLogo(formData);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setCurrent(logoUrl(result.data.sagra.receiptLogo));
    setSource(null);
    toast.success(t.adminSettings.receiptLogoUploaded);
    return true;
  }

  async function remove() {
    setIsRemoving(true);
    const result = await deleteReceiptLogo();
    setIsRemoving(false);
    setConfirmRemove(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCurrent(null);
    toast.success(t.adminSettings.receiptLogoRemoved);
  }

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    onDragLeave: () => setIsDragOver(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      pick(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {current ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* on white like the paper, also in dark mode */}
          <div
            className={cn(
              "flex h-32 w-full items-center justify-center rounded-lg border bg-white p-3 sm:w-56",
              isDragOver && "border-primary ring-1 ring-primary"
            )}
            {...dropHandlers}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={t.adminSettings.receiptLogoSection} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" />
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <UploadIcon className="size-4" />
              {t.adminSettings.receiptLogoChange}
            </Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmRemove(true)}>
              <Trash2Icon className="size-4" />
              {t.adminSettings.receiptLogoRemove}
            </Button>
          </div>
        </div>
      ) : (
        <Empty
          className={cn(
            "h-36 cursor-pointer border transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "hover:border-primary/50"
          )}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          {...dropHandlers}
        >
          <EmptyHeader>
            <EmptyMedia>
              <ImageIcon className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t.adminSettings.receiptLogoEmptyTitle}</EmptyTitle>
            <EmptyDescription>{t.adminSettings.receiptLogoEmptyHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <ReceiptLogoEditor source={source} onCancel={closeEditor} onConfirm={upload} />

      <AlertDialog open={confirmRemove} onOpenChange={(open) => !isRemoving && setConfirmRemove(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminSettings.receiptLogoRemoveTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.adminSettings.receiptLogoRemoveDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>{t.adminSettings.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isRemoving}
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              {isRemoving && <Loader2 className="size-4 animate-spin" />}
              {t.adminSettings.receiptLogoRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
