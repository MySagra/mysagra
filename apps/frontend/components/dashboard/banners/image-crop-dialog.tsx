"use client";

import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, type PercentCrop } from "react-image-crop";
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
import { Loader2Icon } from "lucide-react";

const ASPECT = 480 / 352;
const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const SNAP_THRESHOLD_PCT = 2; // % proximity to trigger guide + snap

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
}

/* ─── subject detection ─────────────────────────────────── */

function detectSubjectCenter(img: HTMLImageElement): { cx: number; cy: number } {
  const MAX = 200;
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { cx: 50, cy: 50 };

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];

  let tw = 0, wx = 0, wy = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = -gray[i - w - 1] + gray[i - w + 1] - 2 * gray[i - 1] + 2 * gray[i + 1] - gray[i + w - 1] + gray[i + w + 1];
      const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1] + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
      const m2 = gx * gx + gy * gy;
      tw += m2; wx += x * m2; wy += y * m2;
    }
  }
  if (tw < 1) return { cx: 50, cy: 50 };
  return { cx: (wx / tw / w) * 100, cy: (wy / tw / h) * 100 };
}

/* ─── crop helpers ──────────────────────────────────────── */

function buildInitialCrop(
  natW: number, natH: number, cx: number, cy: number,
): PercentCrop {
  let wPct = 90;
  let hPct = ((wPct / 100) * natW / ASPECT / natH) * 100;
  if (hPct > 100) { hPct = 100; wPct = (natH * ASPECT / natW) * 100; }
  let x = cx - wPct / 2;
  let y = cy - hPct / 2;
  x = Math.max(0, Math.min(x, 100 - wPct));
  y = Math.max(0, Math.min(y, 100 - hPct));
  return { unit: "%", x, y, width: wPct, height: hPct };
}

/* ─── compression ───────────────────────────────────────── */

/** Detect mime type from a data URL (defaults to image/jpeg) */
function getMimeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-z]+)/i);
  return match ? match[1] : "image/jpeg";
}

async function compressCanvas(
  canvas: HTMLCanvasElement, max: number, mime: string,
): Promise<Blob> {
  const isPng = mime === "image/png";

  if (!isPng) {
    // JPEG: reduce quality iteratively
    let q = 0.92;
    while (q >= 0.5) {
      const b = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", q));
      if (b && b.size <= max) return b;
      q -= 0.05;
    }
  } else {
    // PNG: try at full size first
    const b = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
    if (b && b.size <= max) return b;
  }

  // If still too large, scale down dimensions and retry
  let scale = 0.7;
  while (scale >= 0.3) {
    const sc = document.createElement("canvas");
    sc.width = Math.round(canvas.width * scale);
    sc.height = Math.round(canvas.height * scale);
    const ctx = sc.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(canvas, 0, 0, sc.width, sc.height);

    if (isPng) {
      const b = await new Promise<Blob | null>(r => sc.toBlob(r, "image/png"));
      if (b && b.size <= max) return b;
    } else {
      let q = 0.85;
      while (q >= 0.4) {
        const b = await new Promise<Blob | null>(r => sc.toBlob(r, "image/jpeg", q));
        if (b && b.size <= max) return b;
        q -= 0.05;
      }
    }
    scale -= 0.15;
  }

  // Last resort: return at whatever size we can
  const fallbackMime = isPng ? "image/png" : "image/jpeg";
  const fallbackQ = isPng ? undefined : 0.4;
  const f = await new Promise<Blob | null>(r => canvas.toBlob(r, fallbackMime, fallbackQ));
  return f!;
}

/* ─── guide state type ──────────────────────────────────── */

interface Guides {
  /** show vertical line at this x% of image, null = hidden */
  vx: number | null;
  /** show horizontal line at this y% of image, null = hidden */
  hy: number | null;
}

/* ─── component ─────────────────────────────────────────── */

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
  const [isCompressing, setIsCompressing] = useState(false);
  const [subjectCenter, setSubjectCenter] = useState<{ cx: number; cy: number }>({ cx: 50, cy: 50 });
  const [guides, setGuides] = useState<Guides>({ vx: null, hy: null });
  const isDraggingRef = useRef(false);

  // Snap / guide anchor points (in % of image)
  // Always include image center (50,50); include subject center if it differs enough
  const getAnchors = useCallback(() => {
    const pts: { x: number; y: number }[] = [{ x: 50, y: 50 }];
    if (Math.abs(subjectCenter.cx - 50) > 4 || Math.abs(subjectCenter.cy - 50) > 4) {
      pts.push({ x: subjectCenter.cx, y: subjectCenter.cy });
    }
    return pts;
  }, [subjectCenter]);

  /* ── image loaded ───────────────────────────────────── */

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const center = detectSubjectCenter(img);
      setSubjectCenter(center);
      const ic = buildInitialCrop(img.naturalWidth, img.naturalHeight, center.cx, center.cy);
      setCrop(ic);
      setCompletedCrop(ic);
      setGuides({ vx: null, hy: null });
    },
    [],
  );

  /* ── crop change (called per frame while dragging) ─── */
  // react-image-crop calls onChange(pixelCrop, percentCrop)
  // We use the SECOND argument (percentCrop) for snap math

  function handleChange(_px: Crop, pct: PercentCrop) {
    isDraggingRef.current = true;

    const cropCx = pct.x + pct.width / 2;
    const cropCy = pct.y + pct.height / 2;

    let bestSnapX: number | null = null;
    let bestSnapY: number | null = null;
    let bestDistX = SNAP_THRESHOLD_PCT;
    let bestDistY = SNAP_THRESHOLD_PCT;

    for (const anchor of getAnchors()) {
      const dx = Math.abs(cropCx - anchor.x);
      const dy = Math.abs(cropCy - anchor.y);
      if (dx < bestDistX) { bestDistX = dx; bestSnapX = anchor.x; }
      if (dy < bestDistY) { bestDistY = dy; bestSnapY = anchor.y; }
    }

    // Apply magnetic snap
    let finalX = pct.x;
    let finalY = pct.y;

    if (bestSnapX !== null) {
      finalX = bestSnapX - pct.width / 2;
    }
    if (bestSnapY !== null) {
      finalY = bestSnapY - pct.height / 2;
    }

    // Clamp
    finalX = Math.max(0, Math.min(finalX, 100 - pct.width));
    finalY = Math.max(0, Math.min(finalY, 100 - pct.height));

    const newGuides: Guides = {
      vx: bestSnapX,
      hy: bestSnapY,
    };

    setGuides(newGuides);
    setCrop({ ...pct, x: finalX, y: finalY });
  }

  function handleComplete(_px: Crop, pct: PercentCrop) {
    isDraggingRef.current = false;

    // Apply same snap to completed value
    const cropCx = pct.x + pct.width / 2;
    const cropCy = pct.y + pct.height / 2;

    let finalX = pct.x;
    let finalY = pct.y;

    for (const anchor of getAnchors()) {
      if (Math.abs(cropCx - anchor.x) < SNAP_THRESHOLD_PCT)
        finalX = anchor.x - pct.width / 2;
      if (Math.abs(cropCy - anchor.y) < SNAP_THRESHOLD_PCT)
        finalY = anchor.y - pct.height / 2;
    }

    finalX = Math.max(0, Math.min(finalX, 100 - pct.width));
    finalY = Math.max(0, Math.min(finalY, 100 - pct.height));

    setCompletedCrop({ ...pct, x: finalX, y: finalY });

    // Fade out guides after a short delay
    setTimeout(() => {
      if (!isDraggingRef.current) setGuides({ vx: null, hy: null });
    }, 500);
  }

  /* ── confirm (export) ───────────────────────────────── */

  async function handleConfirm() {
    const image = imgRef.current;
    if (!image || !completedCrop || !imageSrc) return;
    setIsCompressing(true);

    try {
      const canvas = document.createElement("canvas");
      const sX = image.naturalWidth / image.width;
      const sY = image.naturalHeight / image.height;
      const c = completedCrop;
      const px = {
        x: c.unit === "%" ? (c.x / 100) * image.naturalWidth : c.x * sX,
        y: c.unit === "%" ? (c.y / 100) * image.naturalHeight : c.y * sY,
        w: c.unit === "%" ? (c.width / 100) * image.naturalWidth : c.width * sX,
        h: c.unit === "%" ? (c.height / 100) * image.naturalHeight : c.height * sY,
      };
      canvas.width = px.w;
      canvas.height = px.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, px.x, px.y, px.w, px.h, 0, 0, px.w, px.h);

      // Detect original format and preserve it
      const mime = getMimeFromDataUrl(imageSrc);
      const isPng = mime === "image/png";
      const ext = isPng ? "png" : "jpg";

      const blob = await compressCanvas(canvas, MAX_FILE_SIZE, mime);
      onCropComplete(
        new File([blob], `banner-cropped.${ext}`, { type: mime }),
        URL.createObjectURL(blob),
      );
    } finally {
      setIsCompressing(false);
    }
  }

  /* ── render ─────────────────────────────────────────── */

  // Compute pixel-based guide positions from the rendered image
  function renderGuides() {
    const img = imgRef.current;
    if (!img) return null;
    if (guides.vx === null && guides.hy === null) return null;

    // We need the image's rendered size to convert % → px
    // The guides are absolutely positioned inside the wrapper div which
    // has the same size as the ReactCrop component (= same as the image)
    const imgW = img.width;
    const imgH = img.height;

    return (
      <>
        {/* Vertical guide line */}
        {guides.vx !== null && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${(guides.vx / 100) * imgW}px`,
              top: 0,
              width: 0,
              height: `${imgH}px`,
              borderLeft: "1.5px solid rgba(233, 30, 99, 0.9)",
              filter: "drop-shadow(0 0 3px rgba(233, 30, 99, 0.5))",
              zIndex: 50,
              transition: "opacity 0.15s ease",
            }}
          />
        )}

        {/* Horizontal guide line */}
        {guides.hy !== null && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${(guides.hy / 100) * imgH}px`,
              left: 0,
              height: 0,
              width: `${imgW}px`,
              borderTop: "1.5px solid rgba(233, 30, 99, 0.9)",
              filter: "drop-shadow(0 0 3px rgba(233, 30, 99, 0.5))",
              zIndex: 50,
              transition: "opacity 0.15s ease",
            }}
          />
        )}

        {/* Intersection dot */}
        {guides.vx !== null && guides.hy !== null && (
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${(guides.vx / 100) * imgW}px`,
              top: `${(guides.hy / 100) * imgH}px`,
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
              background: "rgba(233, 30, 99, 0.95)",
              boxShadow: "0 0 0 2px white, 0 0 8px rgba(233, 30, 99, 0.6)",
              zIndex: 51,
            }}
          />
        )}
      </>
    );
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
            {/* This wrapper MUST be inline-sized to the image so guides align */}
            <div className="relative inline-block">
              <ReactCrop
                crop={crop}
                onChange={handleChange}
                onComplete={handleComplete}
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

              {/* Smart guide overlays */}
              {renderGuides()}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isCompressing}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isCompressing}>
            {isCompressing ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                {t.banners.compressing}
              </>
            ) : (
              t.banners.cropConfirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
