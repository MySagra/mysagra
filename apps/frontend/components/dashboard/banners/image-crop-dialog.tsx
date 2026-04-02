"use client";

import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/locale-context";

const ASPECT = 480 / 352;

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropDialog({
  open,
  imageSrc,
  onCancel,
  onCropComplete,
}: ImageCropDialogProps) {
  const { t } = useLocale();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      const initialCrop = centerAspectCrop(naturalWidth, naturalHeight, ASPECT);
      setCrop(initialCrop);
      setCompletedCrop(initialCrop);
    },
    [],
  );

  async function handleConfirm() {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.unit === "%" ? (completedCrop.x / 100) * image.naturalWidth : completedCrop.x * scaleX),
      y: (completedCrop.unit === "%" ? (completedCrop.y / 100) * image.naturalHeight : completedCrop.y * scaleY),
      width: (completedCrop.unit === "%" ? (completedCrop.width / 100) * image.naturalWidth : completedCrop.width * scaleX),
      height: (completedCrop.unit === "%" ? (completedCrop.height / 100) * image.naturalHeight : completedCrop.height * scaleY),
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) return;

    const file = new File([blob], "banner-cropped.jpg", { type: "image/jpeg" });
    const previewUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCropComplete(file, previewUrl);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl select-none">
            {t.banners.cropTitle}
          </DialogTitle>
        </DialogHeader>

        {imageSrc && (
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={ASPECT}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop"
                onLoad={onImageLoad}
                style={{ maxHeight: "60vh", maxWidth: "100%" }}
              />
            </ReactCrop>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleConfirm}>
            {t.banners.cropConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
