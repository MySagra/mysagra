"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { CropIcon, ImageIcon, UploadIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { ImageCropDialog } from "./image-crop-dialog";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function getCategoryImageUrl(filename: string) {
  return `/api/images/categories/${filename}`;
}

interface CategoryImageFieldProps {
  /** URL shown in the preview: the cropped file or the saved image */
  preview: string | null;
  onChange: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

/** Scelta immagine categoria: click o drag & drop, poi ritaglio. */
export function CategoryImageField({ preview, onChange, disabled }: CategoryImageFieldProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  function processFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_MIMES.includes(file.type)) {
      toast.error(`Invalid file type. Allowed: ${ALLOWED_MIMES.join(", ")}`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageUrl(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function handleCropComplete(croppedFile: File, previewUrl: string) {
    setCropDialogOpen(false);
    if (croppedFile.size > 1024 * 1024) {
      toast.error(t.categories.imageTooLarge);
      return;
    }
    onChange(croppedFile, previewUrl);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled) processFile(e.dataTransfer.files?.[0]);
  }

  const overlayButtonClassName =
    "flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-white text-sm font-medium hover:bg-white/30 transition-colors";

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIMES.join(", ")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          processFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div
          className="relative overflow-hidden rounded-xl border"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="h-40 w-full object-cover" />
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={overlayButtonClassName}
              >
                <UploadIcon className="h-4 w-4" />
                {t.categories.imageUploadTitle}
              </button>
              {rawImageUrl && (
                <button
                  type="button"
                  onClick={() => setCropDialogOpen(true)}
                  className={overlayButtonClassName}
                >
                  <CropIcon className="h-4 w-4" />
                  {t.categories.recrop}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <Empty
          className={cn(
            "h-40 border transition-colors",
            disabled
              ? "opacity-60"
              : isDragOver
                ? "cursor-pointer border-primary bg-primary/5"
                : "cursor-pointer hover:border-primary/50"
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <EmptyHeader>
            <EmptyMedia>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t.categories.imageUploadTitle}</EmptyTitle>
            <EmptyDescription>{t.categories.imageUploadDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={rawImageUrl}
        onCancel={() => setCropDialogOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
