"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronDownIcon, CropIcon, ImageUpIcon, Trash2Icon, XIcon } from "lucide-react";
import { Banner, BannerType } from "@/lib/api-types";
import { createBanner, getBannerById, updateBanner, uploadBannerImage } from "@/actions/banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { useTimezone } from "@/contexts/timezone-context";
import { ImageCropDialog } from "./image-crop-dialog";
import { WhenPicker } from "./when-picker";
import type { BannerDraft } from "./customer-preview";
import {
  bannerImageUrl,
  bannerName,
  DEFAULT_BANNER_COLOR,
  fromZonedInput,
  isValidUrl,
  normalizeHex,
  normalizeUrl,
  toZonedInput,
} from "./customer-app-utils";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TELEPHONE_RE = /^\+?[\d\s\-().]{6,20}$/;
const LINK_FIELDS = ["website", "facebook", "instagram", "telephone"] as const;

type BannerFormValues = {
  type: BannerType;
  title: string;
  description: string;
  /** "YYYY-MM-DDTHH:mm" nel fuso della sagra */
  startsAt: string;
  endsAt: string;
  /** "now" = visibile da subito, "date" = da visibleFrom */
  showFrom: "now" | "date";
  visibleFrom: string;
  website: string;
  facebook: string;
  instagram: string;
  telephone: string;
  color: string;
};

export interface BannerEditorProps {
  /** null = nuovo banner */
  banner: Banner | null;
  nextPosition: number;
  canEdit: boolean;
  canDelete: boolean;
  /** Nello sheet (mobile) serve un'intestazione con il pulsante di chiusura */
  showHeader?: boolean;
  onSaved: (banner: Banner, isNew: boolean) => void;
  onDeleteRequest: (banner: Banner) => void;
  /** force = salta il controllo delle modifiche non salvate */
  onClose: (force?: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
  onDraftChange: (draft: BannerDraft) => void;
}

export function BannerEditor({
  banner,
  nextPosition,
  canEdit,
  canDelete,
  showHeader,
  onSaved,
  onDeleteRequest,
  onClose,
  onDirtyChange,
  onDraftChange,
}: BannerEditorProps) {
  const { t } = useLocale();
  const timezone = useTimezone();
  const isEditing = !!banner;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savedImage = banner?.image ? bannerImageUrl(banner.image) : null;
  const [imagePreview, setImagePreview] = useState<string | null>(savedImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  const optionalUrl = z
    .string()
    .refine((v) => !v.trim() || isValidUrl(normalizeUrl(v)), t.customerApp.urlInvalid);

  const schema = z
    .object({
      type: z.enum(["EVENT", "SPONSOR"]),
      title: z.string().trim().min(1, t.customerApp.titleRequired).max(100),
      description: z.string().max(250),
      startsAt: z.string(),
      endsAt: z.string(),
      showFrom: z.enum(["now", "date"]),
      visibleFrom: z.string(),
      website: optionalUrl,
      facebook: optionalUrl,
      instagram: optionalUrl,
      telephone: z
        .string()
        .refine((v) => !v.trim() || TELEPHONE_RE.test(v.trim()), t.customerApp.telephoneInvalid),
      color: z.string().regex(/^#?[0-9a-fA-F]{6}$/, t.customerApp.colorInvalid),
    })
    .superRefine((data, ctx) => {
      const isEvent = data.type === "EVENT";
      if (isEvent && (!data.startsAt || !data.endsAt)) {
        ctx.addIssue({ code: "custom", message: t.customerApp.whenRequired, path: ["startsAt"] });
      } else if (isEvent && data.startsAt >= data.endsAt) {
        ctx.addIssue({ code: "custom", message: t.customerApp.datesOrderError, path: ["startsAt"] });
      }
      if (data.showFrom === "date") {
        if (!data.visibleFrom) {
          ctx.addIssue({ code: "custom", message: t.customerApp.showFromRequired, path: ["visibleFrom"] });
        } else if (isEvent && data.endsAt && data.visibleFrom >= data.endsAt) {
          ctx.addIssue({ code: "custom", message: t.customerApp.showFromAfterEvent, path: ["visibleFrom"] });
        }
      }
    });

  const defaultValues = useMemo<BannerFormValues>(() => {
    if (banner) {
      const visibleFrom = new Date(banner.visibleFrom);
      return {
        type: banner.type,
        title: bannerName(banner),
        description: banner.description ?? "",
        startsAt: banner.startsAt ? toZonedInput(banner.startsAt, timezone) : "",
        endsAt: banner.endsAt ? toZonedInput(banner.endsAt, timezone) : "",
        showFrom: visibleFrom > new Date() ? "date" : "now",
        visibleFrom: toZonedInput(visibleFrom, timezone),
        website: banner.website ?? "",
        facebook: banner.facebook ?? "",
        instagram: banner.instagram ?? "",
        telephone: banner.telephone ?? "",
        color: `#${normalizeHex(banner.color)}`,
      };
    }
    return {
      type: "EVENT",
      title: "",
      description: "",
      startsAt: "",
      endsAt: "",
      showFrom: "now",
      visibleFrom: "",
      website: "",
      facebook: "",
      instagram: "",
      telephone: "",
      color: `#${DEFAULT_BANNER_COLOR}`,
    };
    // Il parent rimonta l'editor (key) quando cambia banner
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<BannerFormValues>({
    resolver: standardSchemaResolver(schema) as unknown as Resolver<BannerFormValues>,
    defaultValues,
  });
  const { register, watch, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const dirty = isDirty || !!imageFile;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const values = watch();
  const isEvent = values.type === "EVENT";

  // L'anteprima del telefono segue il form mentre si scrive
  const toIso = (local: string) => (local ? fromZonedInput(local, timezone).toISOString() : null);
  const draft: BannerDraft = {
    id: banner?.id ?? null,
    type: values.type,
    title: values.title.trim(),
    description: values.description.trim(),
    color: normalizeHex(values.color),
    imageUrl: imagePreview,
    startsAt: isEvent ? toIso(values.startsAt) : null,
    endsAt: isEvent ? toIso(values.endsAt) : null,
    visibleFrom: values.showFrom === "date" ? toIso(values.visibleFrom) : null,
    links: {
      website: !!values.website.trim(),
      facebook: !!values.facebook.trim(),
      instagram: !!values.instagram.trim(),
      telephone: !!values.telephone.trim(),
    },
  };
  const draftKey = JSON.stringify(draft);
  useEffect(() => {
    onDraftChange(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, onDraftChange]);

  // Un errore nei link deve essere visibile anche a sezione chiusa
  const linkError = LINK_FIELDS.some((f) => errors[f]) || !!errors.color;
  useEffect(() => {
    if (linkError) setLinksOpen(true);
  }, [linkError]);

  // ── Immagine ───────────────────────────────────────────────────────
  function acceptFile(file: File) {
    if (!ALLOWED_MIMES.includes(file.type)) {
      toast.error(t.customerApp.imageInvalid);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageUrl(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
    // Permette di riscegliere lo stesso file
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && canEdit) acceptFile(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (!canEdit) return;
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    acceptFile(file);
  }

  // ── Salvataggio ────────────────────────────────────────────────────
  function discardChanges() {
    form.reset();
    setImageFile(null);
    setImagePreview(savedImage);
    setRawImageUrl(null);
  }

  async function onSubmit(v: BannerFormValues) {
    const title = v.title.trim();
    const event = v.type === "EVENT";
    // "Da subito": un banner già visibile tiene la sua data
    const visibleFrom =
      v.showFrom === "date"
        ? fromZonedInput(v.visibleFrom, timezone)
        : banner && new Date(banner.visibleFrom) <= new Date()
          ? new Date(banner.visibleFrom)
          : new Date();

    const data = {
      // L'etichetta interna non si mostra più: coincide con il titolo
      label: title,
      type: v.type,
      position: banner?.position ?? nextPosition,
      title,
      description: v.description.trim() || null,
      website: normalizeUrl(v.website) || null,
      facebook: normalizeUrl(v.facebook) || null,
      instagram: normalizeUrl(v.instagram) || null,
      telephone: v.telephone.trim() || null,
      color: normalizeHex(v.color),
      visibleFrom: visibleFrom.toISOString(),
      startsAt: event ? fromZonedInput(v.startsAt, timezone).toISOString() : null,
      endsAt: event ? fromZonedInput(v.endsAt, timezone).toISOString() : null,
    };

    const result = banner ? await updateBanner(banner.id, data) : await createBanner(data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    let saved = result.data;
    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      const upload = await uploadBannerImage(saved.id, formData);
      if (upload.ok) {
        // Serve il nome del file salvato per la miniatura in lista
        saved = await getBannerById(saved.id).catch(() => saved);
      } else {
        toast.error(upload.error);
      }
    }

    toast.success(banner ? t.banners.toastUpdated : t.banners.toastCreated);
    form.reset({
      ...v,
      showFrom: visibleFrom > new Date() ? "date" : "now",
      visibleFrom: toZonedInput(visibleFrom, timezone),
    });
    setImageFile(null);
    setRawImageUrl(null);
    onSaved(saved, !banner);
  }

  const typeOptions: { value: BannerType; label: string; hint: string }[] = [
    { value: "EVENT", label: t.customerApp.typeEvent, hint: t.customerApp.typeEventHint },
    { value: "SPONSOR", label: t.customerApp.typeSponsor, hint: t.customerApp.typeSponsorHint },
  ];

  const links = [
    { field: "website", label: t.customerApp.websiteLabel, short: t.customerApp.websiteShort, type: "url", placeholder: "www.lamiasagra.it" },
    { field: "facebook", label: t.customerApp.facebookLabel, short: t.customerApp.facebookLabel, type: "url", placeholder: "facebook.com/lamiasagra" },
    { field: "instagram", label: t.customerApp.instagramLabel, short: t.customerApp.instagramLabel, type: "url", placeholder: "instagram.com/lamiasagra" },
    { field: "telephone", label: t.customerApp.telephoneLabel, short: t.customerApp.telephoneShort, type: "tel", placeholder: "+39 0123 456789" },
  ] as const;
  const filledLinks = links.filter((l) => values[l.field].trim());

  return (
    <>
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      onPaste={handlePaste}
      className="@container flex h-full min-h-0 flex-col"
      noValidate
    >
      {showHeader && (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
            {banner ? bannerName(banner) : t.customerApp.newBanner}
          </h2>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onClose()} aria-label={t.customerApp.close}>
            <XIcon />
          </Button>
        </div>
      )}

      <fieldset
        disabled={!canEdit || isSubmitting}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 @sm:p-5"
      >
        {!canEdit && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t.customerApp.readOnlyNotice}
          </p>
        )}

        {/* Tipo */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.customerApp.typeQuestion}</p>
          <div role="radiogroup" aria-label={t.customerApp.typeQuestion} className="grid gap-3 @sm:grid-cols-2">
            {typeOptions.map((option) => {
              const selected = values.type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setValue("type", option.value, { shouldDirty: true })}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
                    selected ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Immagine, titolo e descrizione */}
        <div className="grid gap-4 @sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] @2xl:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <Label>{t.customerApp.imageLabel}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_MIMES.join(",")}
              className="hidden"
              onChange={handleFileInput}
            />
            {imagePreview ? (
              <div
                className="relative aspect-480/352 overflow-hidden rounded-xl border"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="size-full object-cover" />
                {canEdit && (
                  <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
                    {rawImageUrl && (
                      <ImageAction onClick={() => setCropOpen(true)}>
                        <CropIcon className="size-3.5" />
                        {t.customerApp.imageRecrop}
                      </ImageAction>
                    )}
                    <ImageAction onClick={() => fileInputRef.current?.click()}>
                      <ImageUpIcon className="size-3.5" />
                      {t.customerApp.imageChange}
                    </ImageAction>
                  </div>
                )}
              </div>
            ) : (
              <div
                role="button"
                tabIndex={canEdit ? 0 : -1}
                aria-disabled={!canEdit}
                onClick={() => canEdit && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (canEdit && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (canEdit) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex aspect-480/352 cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isDragOver ? "border-primary bg-primary/5" : "hover:border-primary/50",
                  !canEdit && "cursor-not-allowed opacity-60"
                )}
              >
                <p>
                  {t.customerApp.imageDrop}{" "}
                  <span className="font-medium text-primary-foreground dark:text-primary">
                    {t.customerApp.imageChoose}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="banner-title">{t.customerApp.titleLabel}</Label>
              <Input
                id="banner-title"
                autoComplete="off"
                maxLength={100}
                placeholder={t.customerApp.titlePlaceholder}
                autoFocus={!banner}
                className="h-10"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1.5">
                <Label htmlFor="banner-description">{t.customerApp.descriptionLabel}</Label>
                <span className="text-xs text-muted-foreground">· {t.customerApp.optional}</span>
              </div>
              <Textarea
                id="banner-description"
                rows={2}
                maxLength={250}
                className="resize-none"
                placeholder={t.customerApp.descriptionPlaceholder}
                {...register("description")}
              />
              {values.description.length > 200 && (
                <p className="text-right text-xs text-muted-foreground">{values.description.length}/250</p>
              )}
            </div>
          </div>
        </div>

        {/* Quando e da quando mostrarlo */}
        <div className="grid gap-4 @sm:grid-cols-2">
          {isEvent && (
            <div className="space-y-1.5">
              <Label htmlFor="banner-when">{t.customerApp.whenLabel}</Label>
              <WhenPicker
                id="banner-when"
                withEnd
                start={values.startsAt}
                end={values.endsAt}
                defaultStartTime="21:00"
                defaultEndTime="23:00"
                placeholder={t.customerApp.whenPlaceholder}
                invalid={!!errors.startsAt}
                disabled={!canEdit}
                onChange={(start, end) => {
                  setValue("startsAt", start, { shouldDirty: true, shouldValidate: !!errors.startsAt });
                  setValue("endsAt", end, { shouldDirty: true });
                }}
              />
              {errors.startsAt && <p className="text-xs text-destructive">{errors.startsAt.message}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="banner-show">{t.customerApp.showLabel}</Label>
            <Select
              value={values.showFrom}
              disabled={!canEdit}
              onValueChange={(next) => {
                setValue("showFrom", next as BannerFormValues["showFrom"], { shouldDirty: true });
                // una data passata non ha senso come programmazione
                if (next === "date" && values.visibleFrom && fromZonedInput(values.visibleFrom, timezone) <= new Date()) {
                  setValue("visibleFrom", "", { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger id="banner-show" className="h-10! w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">{isEvent ? t.customerApp.showNowUntilEvent : t.customerApp.showNow}</SelectItem>
                <SelectItem value="date">{isEvent ? t.customerApp.showFromDateUntilEvent : t.customerApp.showFromDate}</SelectItem>
              </SelectContent>
            </Select>
            {values.showFrom === "date" && (
              <WhenPicker
                id="banner-visible-from"
                start={values.visibleFrom}
                defaultStartTime="00:00"
                placeholder={t.customerApp.showFromPlaceholder}
                invalid={!!errors.visibleFrom}
                disabled={!canEdit}
                onChange={(start) =>
                  setValue("visibleFrom", start, { shouldDirty: true, shouldValidate: !!errors.visibleFrom })
                }
              />
            )}
            {errors.visibleFrom && <p className="text-xs text-destructive">{errors.visibleFrom.message}</p>}
          </div>
        </div>

        {/* Link, contatti e colore */}
        <Collapsible open={linksOpen} onOpenChange={setLinksOpen} className="rounded-xl border">
          <CollapsibleTrigger
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
          >
            <span className="font-medium">{t.customerApp.linksLabel}</span>
            <span className="ml-auto min-w-0 truncate text-sm text-muted-foreground">
              {(filledLinks.length > 0 ? filledLinks : links).map((l) => l.short).join(", ")}
            </span>
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full border"
              style={{ background: `#${normalizeHex(values.color)}` }}
            />
            <ChevronDownIcon
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", linksOpen && "rotate-180")}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 border-t px-4 py-4">
            <div className="grid gap-4 @sm:grid-cols-2">
              {links.map((link) => (
                <div key={link.field} className="space-y-1.5">
                  <Label htmlFor={`banner-${link.field}`}>{link.label}</Label>
                  <Input
                    id={`banner-${link.field}`}
                    type={link.type}
                    autoComplete="off"
                    placeholder={link.placeholder}
                    className="h-10"
                    aria-invalid={!!errors[link.field]}
                    {...register(link.field)}
                  />
                  {errors[link.field] && (
                    <p className="text-xs text-destructive">{errors[link.field]?.message}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="banner-color">{t.customerApp.colorLabel}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={t.customerApp.colorLabel}
                  value={`#${normalizeHex(values.color)}`}
                  onChange={(e) => setValue("color", e.target.value, { shouldDirty: true, shouldValidate: true })}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-1 disabled:cursor-not-allowed"
                />
                <Input
                  id="banner-color"
                  maxLength={7}
                  className="h-10 max-w-32 font-mono uppercase"
                  aria-invalid={!!errors.color}
                  {...register("color")}
                />
              </div>
              <p className={cn("text-xs", errors.color ? "text-destructive" : "text-muted-foreground")}>
                {errors.color?.message ?? t.customerApp.colorHint}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </fieldset>

      {canEdit && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <div className="mr-auto">
            {banner ? (
              canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteRequest(banner)}
                >
                  <Trash2Icon />
                  {t.common.delete}
                </Button>
              )
            ) : (
              <Button type="button" variant="ghost" onClick={() => onClose(true)}>
                {t.common.cancel}
              </Button>
            )}
          </div>
          {banner && dirty && (
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={discardChanges}>
              {t.customerApp.discardChanges}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || (isEditing && !dirty)}>
            {isSubmitting ? t.banners.saving : isEditing ? t.common.save : t.customerApp.createBanner}
          </Button>
        </div>
      )}
    </form>

    <ImageCropDialog
      open={cropOpen}
      imageSrc={rawImageUrl}
      onCancel={() => setCropOpen(false)}
      onCropComplete={(file, previewUrl) => {
        setImageFile(file);
        setImagePreview(previewUrl);
        setCropOpen(false);
      }}
    />
    </>
  );
}

function ImageAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-md bg-black/55 px-2.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
