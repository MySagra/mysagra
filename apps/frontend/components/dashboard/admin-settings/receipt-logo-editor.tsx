"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, Loader2, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocale } from "@/contexts/locale-context";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ADJUSTMENTS,
  adjust,
  autoAdjust,
  canvasToPng,
  dither,
  dotsToCanvas,
  loadImage,
  toGray,
  type LogoAdjustments,
  type LogoMode,
  type ShadeAlgorithm,
} from "@/lib/receipt-logo";

// server actions accept bodies up to 1 MB
const MAX_UPLOAD_BYTES = 1024 * 1024 - 16 * 1024;

interface ReceiptLogoEditorProps {
  /** object URL of the chosen file, null when closed */
  source: string | null;
  onCancel: () => void;
  /** returns false when the upload failed, so the editor stays open */
  onConfirm: (file: File) => Promise<boolean>;
}

// Converts the chosen image to the black dots a thermal printer prints
export function ReceiptLogoEditor({ source, onCancel, onConfirm }: ReceiptLogoEditorProps) {
  const { t } = useLocale();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [adj, setAdj] = useState<LogoAdjustments>(DEFAULT_ADJUSTMENTS);
  // sliders stay smooth: the preview follows a moment later
  const deferred = useDeferredValue(adj);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    loadImage(source)
      .then((loaded) => {
        if (cancelled) return;
        setImg(loaded);
        // start from the automatic choice: usually already good
        setAdj(autoAdjust(loaded, DEFAULT_ADJUSTMENTS));
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t.adminSettings.receiptLogoLoadError);
        onCancel();
      });
    return () => {
      cancelled = true;
      setImg(null);
    };
  }, [source, onCancel, t]);

  // crop + resize + grey levels: once per image
  const gray = useMemo(() => (img ? toGray(img) : null), [img]);

  const result = useMemo(() => {
    if (!gray) return null;
    const dots = dither(adjust(gray, deferred.invert), deferred);
    const canvas = dotsToCanvas(dots, gray.width, gray.height);
    return { canvas, url: canvas.toDataURL("image/png") };
  }, [gray, deferred]);

  function update(patch: Partial<LogoAdjustments>) {
    setAdj((prev) => ({ ...prev, ...patch }));
  }

  async function handleConfirm() {
    if (!result) return;
    setIsSaving(true);
    try {
      const blob = await canvasToPng(result.canvas);
      if (blob.size > MAX_UPLOAD_BYTES) {
        toast.error(t.adminSettings.logoTooHeavy);
        return;
      }
      await onConfirm(new File([blob], "receipt-logo.png", { type: "image/png" }));
    } finally {
      setIsSaving(false);
    }
  }

  const modes: { value: LogoMode; label: string; hint: string }[] = [
    { value: "sharp", label: t.adminSettings.logoModeSharp, hint: t.adminSettings.logoModeSharpHint },
    { value: "shaded", label: t.adminSettings.logoModeShaded, hint: t.adminSettings.logoModeShadedHint },
  ];

  const algorithms: { value: ShadeAlgorithm; label: string; hint: string }[] = [
    { value: "atkinson", label: "Atkinson", hint: t.adminSettings.logoAlgAtkinsonHint },
    { value: "floyd-steinberg", label: "Floyd-Steinberg", hint: t.adminSettings.logoAlgFloydHint },
    { value: "bayer", label: t.adminSettings.logoAlgBayer, hint: t.adminSettings.logoAlgBayerHint },
  ];

  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.adminSettings.logoEditorTitle}</DialogTitle>
          <DialogDescription>{t.adminSettings.logoEditorDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
          {/* white like the paper, also in dark mode */}
          <div className="flex min-h-64 items-center justify-center rounded-lg border bg-white p-6">
            {result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.url}
                alt=""
                className="max-h-56 max-w-full object-contain [image-rendering:pixelated]"
              />
            ) : (
              <Loader2 className="size-5 animate-spin text-neutral-400" />
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.adminSettings.logoEditorTitle}>
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={adj.mode === m.value}
                  onClick={() => update({ mode: m.value })}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    adj.mode === m.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-xs leading-snug text-muted-foreground">{m.hint}</span>
                </button>
              ))}
            </div>

            <SliderField label={t.adminSettings.logoDarkness} value={adj.threshold} min={1} max={254} onChange={(threshold) => update({ threshold })} />

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="logo-invert" className="font-normal">
                {t.adminSettings.logoInvert}
              </Label>
              <Switch id="logo-invert" checked={adj.invert} onCheckedChange={(invert) => update({ invert })} />
            </div>

            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground">
                {t.adminSettings.logoAdvanced}
                <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-3">
                <Label>{t.adminSettings.logoAlgorithm}</Label>
                {/* only the shaded mode uses an algorithm: picking one switches to it */}
                <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={t.adminSettings.logoAlgorithm}>
                  {algorithms.map((a) => {
                    const selected = adj.mode === "shaded" && adj.algorithm === a.value;
                    return (
                      <button
                        key={a.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update({ mode: "shaded", algorithm: a.value })}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-left transition-colors",
                          selected ? "border-primary bg-primary/5" : "hover:bg-muted"
                        )}
                      >
                        <span className="text-sm font-medium">{a.label}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{a.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button type="button" variant="outline" size="sm" className="self-start" disabled={!img} onClick={() => img && setAdj(autoAdjust(img, adj))}>
              <WandSparklesIcon className="size-4" />
              {t.adminSettings.logoAuto}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            {t.adminSettings.cancel}
          </Button>
          <Button onClick={handleConfirm} disabled={!result || isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isSaving ? t.adminSettings.logoUploading : t.adminSettings.logoSave}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      <Label>{label}</Label>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
