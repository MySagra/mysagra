"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { toast } from "sonner";
import { InfoIcon, Trash2Icon, XIcon } from "lucide-react";
import { Category, Printer, Station } from "@/lib/api-types";
import {
  checkCategoryNameExists,
  getCategoryById,
  updateCategory,
  uploadCategoryImage,
} from "@/actions/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/contexts/locale-context";
import { AvailabilitySegmented } from "./availability-control";
import { CategoryThumb } from "./category-sidebar";
import { CategoryImageField, getCategoryImageUrl } from "./category-image-field";

const NONE = "none";

type CategoryFormValues = {
  name: string;
  available: boolean;
  printerId: string;
  stationId: string;
};

export interface CategoryEditorProps {
  category: Category;
  printers: Printer[];
  stations: Station[];
  canEdit: boolean;
  canDelete: boolean;
  onSaved: (category: Category) => void;
  onDeleteRequest: (category: Category) => void;
  /** Omit when the panel is the default view and cannot be closed. force = skip the unsaved-changes guard */
  onClose?: (force?: boolean) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Impostazioni categoria nel pannello laterale, stessa struttura dell'editor del piatto. */
export function CategoryEditor({
  category,
  printers,
  stations,
  canEdit,
  canDelete,
  onSaved,
  onDeleteRequest,
  onClose,
  onDirtyChange,
}: CategoryEditorProps) {
  const { t } = useLocale();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().trim().min(1, t.categories.nameRequired).max(100),
    available: z.boolean(),
    printerId: z.string(),
    stationId: z.string(),
  });

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(schema) as unknown as Resolver<CategoryFormValues>,
    defaultValues: {
      name: category.name,
      available: category.available,
      printerId: category.printerId ?? NONE,
      stationId: category.stationId ?? NONE,
    },
  });
  const { register, control, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const dirty = isDirty || !!imageFile;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // La disponibilità può cambiare da fuori (chip nell'intestazione o in lista)
  const externalAvailable = category.available;
  useEffect(() => {
    if (!form.getFieldState("available").isDirty) {
      form.resetField("available", { defaultValue: externalAvailable });
    }
  }, [externalAvailable, form]);

  const [available, printerId, stationId] = useWatch({
    control,
    name: ["available", "printerId", "stationId"],
  });

  function discardChanges() {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
  }

  async function onSubmit(values: CategoryFormValues) {
    const name = values.name.trim();
    if (await checkCategoryNameExists(name, category.id)) {
      form.setError("name", { message: t.categories.nameDuplicate });
      return;
    }

    const result = await updateCategory(category.id, {
      name,
      available: values.available,
      printerId: values.printerId === NONE ? null : values.printerId,
      stationId: values.stationId === NONE ? null : values.stationId,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    form.reset({ ...values, name });

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      const imgResult = await uploadCategoryImage(category.id, formData);
      if (!imgResult.ok) {
        // I dati sono salvati: resta solo l'immagine da riprovare
        onSaved(result.data);
        toast.error(imgResult.error);
        return;
      }
      setImageFile(null);
      setImagePreview(null);
      // Rilegge la categoria per avere il nuovo nome file dell'immagine
      onSaved(await getCategoryById(category.id));
    } else {
      onSaved(result.data);
    }
    toast.success(t.categories.toastUpdated);
  }

  const preview = imagePreview ?? (category.image ? getCategoryImageUrl(category.image) : null);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex h-full min-h-0 flex-col"
      noValidate
    >
      <div className="flex items-center gap-2.5 border-b px-4 py-3">
        <CategoryThumb category={category} className="size-7 rounded-md text-xs" />
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{category.name}</h2>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onClose()}
            aria-label={t.menu.close}
          >
            <XIcon />
          </Button>
        )}
      </div>

      <fieldset
        disabled={!canEdit || isSubmitting}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4"
      >
        {!canEdit && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {t.menu.readOnlyNotice}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="category-name">{t.categories.nameLabel}</Label>
          <Input
            id="category-name"
            autoComplete="off"
            maxLength={100}
            placeholder={t.categories.namePlaceholder}
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>{t.menu.statusLabel}</Label>
          <AvailabilitySegmented
            value={available}
            disabled={!canEdit}
            onChange={(v) => setValue("available", v, { shouldDirty: true })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.categories.stationLabel}</Label>
          <Select
            value={stationId}
            onValueChange={(v) => setValue("stationId", v, { shouldDirty: true })}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.categories.stationSelectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t.categories.noStation}</SelectItem>
              {stations.map((station) => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t.categories.defaultPrinterLabel}</Label>
          <Select
            value={printerId}
            onValueChange={(v) => setValue("printerId", v, { shouldDirty: true })}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.categories.printerSelectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t.categories.noPrinter}</SelectItem>
              {printers.map((printer) => (
                <SelectItem key={printer.id} value={printer.id}>
                  {printer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-px size-3.5 shrink-0" />
          {t.categories.propagationHint}
        </p>

        <div className="space-y-1.5">
          <Label>{t.categories.imageLabel}</Label>
          <CategoryImageField
            preview={preview}
            disabled={!canEdit || isSubmitting}
            onChange={(file, previewUrl) => {
              setImageFile(file);
              setImagePreview(previewUrl);
            }}
          />
        </div>
      </fieldset>

      {canEdit && (
        <div className="flex items-center gap-2 border-t px-4 py-3">
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive hover:text-destructive"
              onClick={() => onDeleteRequest(category)}
            >
              <Trash2Icon />
              {t.common.delete}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className={canDelete ? "" : "ml-auto"}
            disabled={isSubmitting || (!dirty && !onClose)}
            onClick={() => (onClose ? onClose(true) : discardChanges())}
          >
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting || !dirty}>
            {isSubmitting ? t.categories.saving : t.common.save}
          </Button>
        </div>
      )}
    </form>
  );
}
