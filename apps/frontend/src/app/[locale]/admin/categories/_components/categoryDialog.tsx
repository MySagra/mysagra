"use client"

import { Button } from "@/components/ui/button"
import { Pencil, PlusCircle } from "lucide-react";
import { UploadImage, UploadImageRef } from "@/components/ui/uploadImage";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Category } from "@/types/category";
import { useRef, useState } from "react";

import { CategoryFormValues, getCategoryFormSchema } from "@/schemas/categoryForm";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCreateCategory, useUpdateCategory, useUploadCategoryImage } from "@/hooks/api/categories";

interface CategoryDialog {
    category?: Category
    setShow?: React.Dispatch<React.SetStateAction<boolean>>
    imageURL?: string
}

export default function CategoryDialog({ category, setShow, imageURL }: CategoryDialog) {
    const uploadRef = useRef<UploadImageRef>(null);
    const t = useTranslations('Category');
    const [open, setOpen] = useState(false);
    
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const uploadImageMutation = useUploadCategoryImage();

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(getCategoryFormSchema(t)),
        defaultValues: {
            name: category?.name || "",
            position: category?.position || 1,
            available: category?.available || true
        }
    })

    // Handle category creation
    async function handleCreateCategory(values: CategoryFormValues) {
        const { image, ...categoryDataWithoutImage } = values;

        try {
            // First create the category
            const newCategory = await createCategoryMutation.mutateAsync(categoryDataWithoutImage);
            
            // Then upload the image if present
            if (image) {
                await uploadImageMutation.mutateAsync({
                    categoryId: newCategory.id,
                    imageFile: image
                });
            }

            toast.success(t('toast.createSuccess'));
            form.reset();
            uploadRef.current?.reset();
            setOpen(false);
        } catch (error) {
            toast.error(t('toast.createError'));
        }
    }

    // Handle category update
    async function handleUpdateCategory(values: CategoryFormValues) {
        if (!category?.id) return;
        
        const { image, ...categoryDataWithoutImage } = values;

        try {
            // First update the category
            const updatedCategory = await updateCategoryMutation.mutateAsync({
                categoryId: category.id,
                categoryData: categoryDataWithoutImage
            });

            // Then upload the image if present
            if (image) {
                await uploadImageMutation.mutateAsync({
                    categoryId: category.id,
                    imageFile: image
                });
            }

            toast.success(t('toast.updateSuccess'));
            if (setShow) setShow(updatedCategory.available);
            setOpen(false);
        } catch (error) {
            toast.error(t('toast.updateError'));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {
                    category ?
                        <Button size={"icon"} className="size-7" variant="edit">
                            <Pencil />
                        </Button>
                        :
                        <Button className="w-min">
                            <PlusCircle />
                            {t('dialog.trigger')}
                        </Button>
                }
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {
                            category ? t('dialog.updateTitle') : t('dialog.createTitle')
                        }
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <CategoryForm
                    form={form}
                    uploadRef={uploadRef}
                    onSubmit={category ? handleUpdateCategory : handleCreateCategory}
                    category={category}
                    imageURL={imageURL}
                    isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending || uploadImageMutation.isPending}
                />
            </DialogContent>
        </Dialog>
    )
}

interface CategoryFormProps {
    form: ReturnType<typeof useForm<CategoryFormValues>>;
    uploadRef: React.RefObject<UploadImageRef | null>;
    onSubmit: (values: CategoryFormValues) => void;
    category?: Category;
    imageURL?: string;
    isLoading?: boolean;
}

function CategoryForm({ form, onSubmit, category, imageURL, uploadRef, isLoading }: CategoryFormProps) {
    const t = useTranslations('Category');
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Category name field */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.name.title')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('formFields.name.placeholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.name.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Category position field */}
                <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.position.title')}</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    placeholder="1" 
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.position.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Category image upload field */}
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.image.title')}</FormLabel>
                            <FormControl>
                                <UploadImage
                                    ref={uploadRef}
                                    initialPreview={imageURL}
                                    category={category}
                                    onChange={(file: File | undefined) => {
                                        field.onChange(file);
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.image.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {/* Category availability checkbox */}
                <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormLabel>{t('formFields.available.title')}</FormLabel>
                            <FormControl>
                                <Checkbox
                                    id="available"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="size-5 accent-primary"
                                />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.available.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isLoading}>{t('dialog.cancel')}</Button>
                    </DialogClose>
                    {
                        category ?
                            <Button 
                                type="submit" 
                                className="bg-blue-500 hover:bg-blue-500/80 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? t('dialog.loading') : t('dialog.edit')}
                            </Button>
                            :
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? t('dialog.loading') : t('dialog.create')}
                            </Button>
                    }
                </DialogFooter>
            </form>
        </Form>
    )
}