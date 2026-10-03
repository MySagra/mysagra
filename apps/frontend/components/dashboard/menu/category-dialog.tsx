"use client";

import { useEffect, useState } from "react";
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
import { Trash2Icon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CategoryImageField, getCategoryImageUrl } from "./category-image-field";
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
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  printers = [],
  stations = [],
  onSaved,
  onDelete,
}: CategoryDialogProps) {
  const { t } = useLocale();
  const isEditing = !!category;
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      const result = await createCategory(data);
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

              <Alert role="note" className="bg-muted/40 border-dashed">
                <InfoIcon className="size-3.5" />
                <AlertDescription className="text-xs">
                  {t.categories.propagationHint}
                </AlertDescription>
              </Alert>

              <Field>
                <FieldLabel>{t.categories.imageLabel}</FieldLabel>
                <CategoryImageField
                  preview={imagePreview}
                  onChange={(file, previewUrl) => {
                    setImageFile(file);
                    setImagePreview(previewUrl);
                  }}
                />
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
  );
}
