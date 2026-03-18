"use client";

import { useEffect, useRef, useState } from "react";
import { Category, Printer } from "@/lib/api-types";
import { createCategory, updateCategory, uploadCategoryImage } from "@/actions/categories";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2Icon, ImageIcon, UploadIcon } from "lucide-react";
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
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  printers?: Printer[];
  onSaved: (category: Category) => void;
  onDelete?: (category: Category) => void;
  categoriesCount?: number;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  printers = [],
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categorySchema = z.object({
    name: z.string().min(1, t.categories.nameRequired),
    available: z.boolean(),
    printerId: z.string().optional(),
  });

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(categorySchema),
    defaultValues: {
      name: "",
      available: true,
      printerId: "none",
    },
  });

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          available: category.available,
          printerId: category.printerId || "none",
        });
      } else {
        form.reset({
          name: "",
          available: true,
          printerId: "none",
        });
      }
      setImagePreview(null);
      setImageFile(null);
    }
  }, [category, open, form]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }

  function processFile(file: File) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }

  async function onSubmit(values: CategoryFormValues) {
    try {
      const data = {
        name: values.name.trim(),
        available: values.available,
        printerId: values.printerId === "none" ? null : values.printerId,
      };

      let savedCategory;

      if (isEditing && category) {
        savedCategory = await updateCategory(category.id, data);
        toast.success(t.categories.toastUpdated);
      } else {
        savedCategory = await createCategory({ ...data, position: categoriesCount });
        toast.success(t.categories.toastCreated);
      }

      if (imageFile && savedCategory) {
        const formData = new FormData();
        formData.append("image", imageFile);
        await uploadCategoryImage(savedCategory.id, formData);
      }

      onSaved(savedCategory);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t.categories.toastErrorSave);
    }
  }

  function handleDeleteConfirm() {
    if (category && onDelete) {
      setShowDeleteConfirm(false);
      onDelete(category);
      onOpenChange(false);
    }
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
                  <FieldLabel htmlFor="name">{t.categories.nameLabel}</FieldLabel>
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
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <div
                      className="relative cursor-pointer rounded-xl border overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <UploadIcon className="h-6 w-6 text-white" />
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
                    onClick={() => setShowDeleteConfirm(true)}
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.categories.confirmDeletionTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.categories.confirmDeletionDescription} <span className="font-bold">{category?.name}</span>?
              <br />
              {t.categories.cannotUndo}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
