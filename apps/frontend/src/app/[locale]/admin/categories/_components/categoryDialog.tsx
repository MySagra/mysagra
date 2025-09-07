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
import { useRef } from "react";

import { CategoryFormValues, getCategoryFormSchema } from "@/schemas/categoryForm";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface CategoryDialog {
    category?: Category
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>
    setShow?: React.Dispatch<React.SetStateAction<boolean>>
    imageURL?: string
}

export default function CategoryDialog({ category, setCategories, setShow, imageURL }: CategoryDialog) {
    const uploadRef = useRef<UploadImageRef>(null);
    const t = useTranslations('Category');

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(getCategoryFormSchema(t)),
        defaultValues: {
            name: category?.name || "",
            position: category?.position !== undefined ? String(category.position) : "1",
            available: category?.available || true
        }
    })

    function createCategory(values: CategoryFormValues) {
        const file = uploadRef.current?.getFile();
        const categoryData = { ...values };

        if (file) {
            categoryData.image = file;
        }

        const { image, ...categoryDataWithoutImage } = categoryData;
        fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryDataWithoutImage),
        }).then(async res => {
            let data = await res.json();
            if (!res.ok) return;
            if (image) {
                data = await (await uploadImage(image, data.id)).json();
            }
            form.reset();
            uploadRef.current?.reset();
            setCategories(prev =>
                [...prev, data].sort((a, b) => Number(a.position) - Number(b.position))
            );
        }).then(() => {
            toast.success("Category created succesfully");
        })
    }

    function updateCategory(values: CategoryFormValues) {
        const file = uploadRef.current?.getFile();
        const categoryData = { ...values };

        if (file) {
            categoryData.image = file;
        }

        const { image, ...categoryDataWithoutImage } = categoryData;
        fetch(`/api/categories/${category?.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryDataWithoutImage),
        }).then(async res => {
            let data = await res.json();

            if (!res.ok) return
            if (image) {
                data = await (await uploadImage(image, data.id)).json();
            }
            if (setShow) setShow(data.available);
            setCategories(prev =>
                prev
                    .map(c => c.id === data.id ? { ...c, ...data } : c)
                    .sort((a, b) => Number(a.position) - Number(b.position))
            );
        }).then(() => {
            toast.info(t('toast.updateSuccess'));
        }).catch(err => {
            toast.error(t('toast.updateError'));
            console.error(err);
        })
    }

    async function uploadImage(image: File, id: string) {
        const imageFormData = new FormData();
        imageFormData.append('image', image);

        return await fetch(`/api/categories/${id}/image`, {
            method: "PATCH",
            credentials: "include",
            body: imageFormData,
        });
    }

    return (
        <Dialog>
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
                    onSubmit={
                        category ? updateCategory : createCategory
                    }
                    category={category}
                    imageURL={imageURL}
                />
            </DialogContent>
        </Dialog>
    )
}

interface CategoryFormProps {
    form: ReturnType<typeof useForm<CategoryFormValues>>;
    uploadRef: React.RefObject<UploadImageRef | null>;
    onSubmit: (values: CategoryFormValues) => void;
    category?: Category,
    imageURL?: string
}

function CategoryForm({ form, onSubmit, category, imageURL, uploadRef }: CategoryFormProps) {
    const t = useTranslations('Category');
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.position.title')}</FormLabel>
                            <FormControl>
                                <Input placeholder="1" {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.position.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
                                        console.log("File changed:", file);
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
                        <Button variant="outline">{t('dialog.cancel')}</Button>
                    </DialogClose>
                    {
                        category ?
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-500/80 text-white">{t('dialog.edit')}</Button>
                            :
                            <Button type="submit">{t('dialog.create')}</Button>
                    }
                </DialogFooter>
            </form>
        </Form>
    )
}