"use client";

import { useEffect, useRef, useState } from "react";

function getCategoryImageUrl(filename: string) {
  return `/api/images/categories/${filename}`;
}
import { Category, Printer, Station } from "@/lib/api-types";
import { createCategory, updateCategory, uploadCategoryImage, getCategoryById, checkCategoryNameExists } from "@/actions/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2Icon, ImageIcon, UploadIcon, CropIcon } from "lucide-react";
import { ImageCropDialog } from "./image-crop-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { z } from "zod";
import { useLocale } from "@/contexts/locale-context";

type CategoryFormValues = {
  name: string;
  available: boolean;
  printerId?: string;
  stationId?: string;
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  printers?: Printer[];
  stations?: Station[];
  onSaved: (category: Category) => void;
  onDelete?: (category: Category) => void;
  categoriesCount?: number;
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  printers = [],
  stations = [],
  onSaved,
  onDelete,
  categoriesCount = 0,
}: CategoryDialogProps) {
  const { t } = useLocale();
  const isEditing = !!category;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  const categorySchema = z.object({
    name: z.string().min(1, t.categories.nameRequired).max(100, "Name must be max 100 characters"),
    available: z.boolean(),
    printerId: z.string().optional(),
    stationId: z.string().optional(),
  });

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(categorySchema),
    defaultValues: {
      name: "",
      available: true,
      printerId: "none",
      stationId: "none",
    },
  });

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          available: category.available,
          printerId: category.printerId || "none",
          stationId: category.stationId || "none",
        });
      } else {
        form.reset({
          name: "",
          available: true,
          printerId: "none",
          stationId: "none",
        });
      }
      setImagePreview(category?.image ? getCategoryImageUrl(category.image) : null);
      setImageFile(null);
    }
  }, [category, open, form]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (ALLOWED_MIMES.includes(file.type)) {
        processFile(file);
      } else {
        toast.error(`Invalid file type. Allowed: ${ALLOWED_MIMES.join(", ")}`);
      }
    }
  }

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setRawImageUrl(dataUrl);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function handleCropComplete(croppedFile: File, previewUrl: string) {
    setImageFile(croppedFile);
    setImagePreview(previewUrl);
    setCropDialogOpen(false);
  }

  function handleCropCancel() {
    setCropDialogOpen(false);
  }

  function handleRecrop() {
    if (rawImageUrl) {
      setCropDialogOpen(true);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (ALLOWED_MIMES.includes(file.type)) {
        processFile(file);
      } else {
        toast.error(`Invalid file type. Allowed: ${ALLOWED_MIMES.join(", ")}`);
      }
    }
  }

  async function onSubmit(values: CategoryFormValues) {
    const nameTrimmed = values.name.trim();

    const exists = await checkCategoryNameExists(nameTrimmed, isEditing && category ? category.id : undefined);
    if (exists) {
      toast.error(t.categories.nameDuplicate);
      return;
    }

    const data = {
      name: nameTrimmed,
      available: values.available,
      printerId: values.printerId === "none" ? null : values.printerId,
      stationId: values.stationId === "none" ? null : values.stationId,
    };

    let savedCategory: Category;

    if (isEditing && category) {
      const result = await updateCategory(category.id, data);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(t.categories.toastUpdated);
      savedCategory = result.data;
    } else {
      const result = await createCategory({ ...data, position: categoriesCount });
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(t.categories.toastCreated);
      savedCategory = result.data;
    }

    if (imageFile && savedCategory) {
      const formData = new FormData();
      formData.append("image", imageFile);
      const imgResult = await uploadCategoryImage(savedCategory.id, formData);
      if (!imgResult.ok) { toast.error(imgResult.error); return; }
      // Re-fetch to get updated image filename for immediate preview
      savedCategory = await getCategoryById(savedCategory.id);
    }

    onSaved(savedCategory);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl select-none">
              {isEditing ? t.categories.editTitle : t.categories.newTitle}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="py-2">
                <Field>
                  <FieldLabel htmlFor="name" required>{t.categories.nameLabel}</FieldLabel>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="name"
                            autoComplete="off"
                            placeholder={t.categories.namePlaceholder}
                            autoFocus
                            maxLength={100}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>

                <div className="flex items-center gap-3">
                  <FieldLabel htmlFor="available" className="mb-0">
                    {t.categories.availableLabel}
                  </FieldLabel>
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Checkbox
                            id="available"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Field>
                  <FieldLabel>{t.categories.stationLabel}</FieldLabel>
                  <FormField
                    control={form.control}
                    name="stationId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.categories.stationSelectPlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.categories.noStation}</SelectItem>
                            {stations.map((station) => (
                              <SelectItem key={station.id} value={station.id}>
                                {station.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>

                <Field>
                  <FieldLabel>{t.categories.defaultPrinterLabel}</FieldLabel>
                  <FormField
                    control={form.control}
                    name="printerId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.categories.printerSelectPlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t.categories.noPrinter}</SelectItem>
                            {printers.map((printer) => (
                              <SelectItem key={printer.id} value={printer.id}>
                                {printer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>

                <Field>
                  <FieldLabel>{t.categories.imageLabel}</FieldLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_MIMES.join(", ")}
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <div
                      className="relative cursor-pointer rounded-xl border overflow-hidden"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-white text-sm font-medium hover:bg-white/30 transition-colors"
                        >
                          <UploadIcon className="h-4 w-4" />
                          {t.categories.imageUploadTitle}
                        </button>
                        {rawImageUrl && (
                          <button
                            type="button"
                            onClick={handleRecrop}
                            className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-white text-sm font-medium hover:bg-white/30 transition-colors"
                          >
                            <CropIcon className="h-4 w-4" />
                            {t.categories.recrop}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Empty
                      className={`cursor-pointer border transition-colors h-40 ${isDragOver
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                        }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <EmptyHeader>
                        <EmptyMedia>
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>{t.categories.imageUploadTitle}</EmptyTitle>
                        <EmptyDescription>
                          {t.categories.imageUploadDescription}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </Field>
              </FieldGroup>
              <DialogFooter>
                {isEditing && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => { onDelete!(category!); onOpenChange(false); }}
                    className="mr-auto"
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    {t.common.delete}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? t.categories.saving
                    : isEditing
                      ? t.common.save
                      : t.categories.create}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={rawImageUrl}
        onCancel={handleCropCancel}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
