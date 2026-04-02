"use client";

import { useEffect, useRef, useState } from "react";
import { Banner } from "@/lib/api-types";
import { createBanner, updateBanner, uploadBannerImage } from "@/actions/banners";
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

function getBannerImageUrl(filename: string) {
  return `/api/images/banners/${filename}`;
}

type BannerFormValues = {
  label: string;
  type: "EVENT" | "SPONSOR";
  title?: string;
  description?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  color: string;
  dateTime?: string;
};

interface BannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  onSaved: (banner: Banner) => void;
  onDelete?: (banner: Banner) => void;
}

export function BannerDialog({
  open,
  onOpenChange,
  banner,
  onSaved,
  onDelete,
}: BannerDialogProps) {
  const { t } = useLocale();
  const isEditing = !!banner;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const bannerSchema = z.object({
    label: z.string().min(1, t.banners.labelRequired),
    type: z.enum(["EVENT", "SPONSOR"], { error: t.banners.typeRequired }),
    title: z.string().optional(),
    description: z.string().optional(),
    website: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    color: z.string(),
    dateTime: z.string().optional(),
  });

  const form = useForm<BannerFormValues>({
    resolver: standardSchemaResolver(bannerSchema),
    defaultValues: {
      label: "",
      type: "EVENT",
      title: "",
      description: "",
      website: "",
      facebook: "",
      instagram: "",
      color: "#fecc01",
      dateTime: "",
    },
  });

  const watchedType = form.watch("type");

  useEffect(() => {
    if (open) {
      if (banner) {
        form.reset({
          label: banner.label,
          type: banner.type,
          title: banner.title ?? "",
          description: banner.description ?? "",
          website: banner.website ?? "",
          facebook: banner.facebook ?? "",
          instagram: banner.instagram ?? "",
          color: banner.color ? `#${banner.color.replace(/^#/, "")}` : "#fecc01",
          dateTime: banner.dateTime
            ? new Date(banner.dateTime).toISOString().slice(0, 16)
            : "",
        });
        setImagePreview(banner.image ? getBannerImageUrl(banner.image) : null);
      } else {
        form.reset({
          label: "",
          type: "EVENT",
          title: "",
          description: "",
          website: "",
          facebook: "",
          instagram: "",
          color: "#fecc01",
          dateTime: "",
        });
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [banner, open, form]);

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

  async function onSubmit(values: BannerFormValues) {
    try {
      const data = {
        label: values.label.trim(),
        type: values.type,
        title: values.title?.trim() || null,
        description: values.description?.trim() || null,
        website: values.website?.trim() || null,
        facebook: values.facebook?.trim() || null,
        instagram: values.instagram?.trim() || null,
        color: values.color.replace(/^#/, ""),
        dateTime: values.type === "EVENT" && values.dateTime
          ? new Date(values.dateTime).toISOString()
          : null,
      };

      let savedBanner: Banner;

      if (isEditing && banner) {
        savedBanner = await updateBanner(banner.id, data);
        toast.success(t.banners.toastUpdated);
      } else {
        savedBanner = await createBanner(data);
        toast.success(t.banners.toastCreated);
      }

      if (imageFile && savedBanner) {
        const formData = new FormData();
        formData.append("image", imageFile);
        await uploadBannerImage(savedBanner.id, formData);
      }

      onSaved(savedBanner);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t.banners.toastErrorSave);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl select-none">
            {isEditing ? t.banners.editTitle : t.banners.newTitle}
          </DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="py-2">

              {/* Label */}
              <Field>
                <FieldLabel htmlFor="label" required>{t.banners.labelLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="label"
                          autoComplete="off"
                          placeholder={t.banners.labelPlaceholder}
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Type */}
              <Field>
                <FieldLabel required>{t.banners.typeLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.banners.typeSelectPlaceholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EVENT">{t.banners.typeEvent}</SelectItem>
                          <SelectItem value="SPONSOR">{t.banners.typeSponsor}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Title */}
              <Field>
                <FieldLabel htmlFor="title">{t.banners.titleLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="title"
                          autoComplete="off"
                          placeholder={t.banners.titlePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="description">{t.banners.descriptionLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="description"
                          autoComplete="off"
                          placeholder={t.banners.descriptionPlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Website */}
              <Field>
                <FieldLabel htmlFor="website">{t.banners.websiteLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="website"
                          type="url"
                          autoComplete="off"
                          placeholder={t.banners.websitePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Facebook */}
              <Field>
                <FieldLabel htmlFor="facebook">{t.banners.facebookLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="facebook"
                          type="url"
                          autoComplete="off"
                          placeholder={t.banners.facebookPlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Instagram */}
              <Field>
                <FieldLabel htmlFor="instagram">{t.banners.instagramLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          id="instagram"
                          type="url"
                          autoComplete="off"
                          placeholder={t.banners.instagramPlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* Color */}
              <Field>
                <FieldLabel htmlFor="color">{t.banners.colorLabel}</FieldLabel>
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            id="color"
                            value={field.value}
                            onChange={field.onChange}
                            className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
                          />
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="font-mono"
                            maxLength={7}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              {/* DateTime — only for EVENT */}
              {watchedType === "EVENT" && (
                <Field>
                  <FieldLabel htmlFor="dateTime">{t.banners.dateTimeLabel}</FieldLabel>
                  <FormField
                    control={form.control}
                    name="dateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            id="dateTime"
                            type="datetime-local"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>
              )}

              {/* Image */}
              <Field>
                <FieldLabel>{t.banners.imageLabel}</FieldLabel>
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
                      <EmptyTitle>{t.banners.imageUploadTitle}</EmptyTitle>
                      <EmptyDescription>
                        {t.banners.imageUploadDescription}
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
                  onClick={() => { onDelete!(banner!); onOpenChange(false); }}
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
                  ? t.banners.saving
                  : isEditing
                    ? t.common.save
                    : t.banners.create}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
