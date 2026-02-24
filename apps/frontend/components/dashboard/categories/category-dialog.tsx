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
  DialogDescription,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  available: z.boolean(),
  printerId: z.string().optional(),
});

type CategoryFormValues = z.input<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  printers?: Printer[];
  onSaved: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  printers = [],
  onSaved,
  onDelete,
}: CategoryDialogProps) {
  const isEditing = !!category;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
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
        toast.success("Category updated");
      } else {
        savedCategory = await createCategory(data);
        toast.success("Category created");
      }

      if (imageFile && savedCategory) {
        const formData = new FormData();
        formData.append("image", imageFile);
        await uploadCategoryImage(savedCategory.id, formData);
      }

      onSaved(savedCategory);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error saving category");
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
              {isEditing ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="py-2">
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="name"
                            autoComplete="off"
                            placeholder="Category name"
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
                    Available
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
                  <FieldLabel>Default Printer</FieldLabel>
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
                              <SelectValue placeholder="Select printer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No printer</SelectItem>
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
                  <FieldLabel>Image</FieldLabel>
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
                        <EmptyTitle>Upload an image</EmptyTitle>
                        <EmptyDescription>
                          Drag here or click to select a file
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
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Save"
                      : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category <span className="font-bold">{category?.name}</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
