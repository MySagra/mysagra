"use client"

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { Food } from "@/types/food"
import { Pencil, PlusCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Checkbox } from "@/components/ui/checkbox"
import { Category } from "@/types/category"
import { useEffect, useState } from "react"

import {FoodFormValues, getFoodFormSchema } from "@/schemas/foodForm"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useCreateFood, useUpdateFood } from "@/hooks/api/food"

interface FoodDialogProp {
    food?: Food
    categories: Array<Category>
}

export function FoodDialog({ food, categories }: FoodDialogProp) {
    const t = useTranslations('Food');
    const [open, setOpen] = useState(false);
    const [ lastCategoryId, setLastCategoryId ] = useState<number | undefined>(food?.categoryId || categories[0]?.id);

    const createFoodMutation = useCreateFood();
    const updateFoodMutation = useUpdateFood();

    const form = useForm<FoodFormValues>({
        resolver: zodResolver(getFoodFormSchema(t)),
        defaultValues: {
            name: food?.name || "",
            description: food?.description || "",
            price: food?.price || 0,
            categoryId: lastCategoryId || (categories.length > 0 ? categories[0].id : 0),
            available: food?.available ?? true
        }
    })

    useEffect(() => {
        if (!food) {
            form.setValue('available', true);
            if (categories.length > 0 && !form.getValues('categoryId')) {
                form.setValue('categoryId', categories[0].id);
            }
        }
    }, [categories, food, form]);

    useEffect(() => {
        form.setValue('categoryId', lastCategoryId || 0);
    }, [lastCategoryId, form])

    useEffect(() => {
        if (food) {
            form.reset({
                name: food.name || "",
                description: food.description || "",
                price: food.price || 0,
                categoryId: food.categoryId,
                available: food.available ?? true
            });
        } else {
            const defaultCategoryId = categories.length > 0 ? categories[0].id : 0;
            form.reset({
                name: "",
                description: "",
                price: 0,
                categoryId: lastCategoryId || defaultCategoryId,
                available: true
            });
        }
    }, [food, categories, lastCategoryId, form]);

    // Handler to create a new food
    async function handleCreateFood(values: FoodFormValues) {
        try {
            await createFoodMutation.mutateAsync(values);
            toast.success(t('toast.createSuccess'));
            form.reset({
                name: "",
                description: "",
                price: 0,
                categoryId: values.categoryId,
                available: true
            });
            setLastCategoryId(values.categoryId);
            setOpen(false);
        } catch (error) {
            toast.error(t('toast.createError'));
            console.error(error);
        }
    }

    // Handler to update an existing food
    async function handleUpdateFood(values: FoodFormValues) {
        if (!food?.id) return;
        
        try {
            await updateFoodMutation.mutateAsync({ 
                foodId: food.id, 
                foodData: values 
            });
            toast.info(t('toast.updateSuccess'));
            setOpen(false);
        } catch (error) {
            toast.error(t('toast.updateError'));
            console.error(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {
                    food ?
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
                            food ? t('dialog.updateTitle') : t('dialog.createTitle')
                        }
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <FoodForm
                    form={form}
                    onSubmit={food ? handleUpdateFood : handleCreateFood}
                    food={food}
                    categories={categories}
                />
            </DialogContent>
        </Dialog>
    )
}

interface FoodFormProps {
    form: ReturnType<typeof useForm<FoodFormValues>>;
    onSubmit: (values: FoodFormValues) => void;
    food?: Food
    categories: Array<Category>
}

function FoodForm({ form, onSubmit, food, categories }: FoodFormProps) {

    const t = useTranslations('Food');

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
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.description.title')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('formFields.description.placeholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.description.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.price.title')}</FormLabel>
                            <FormControl>
                                <Input placeholder={t('formFields.price.placeholder')} {...field} />
                            </FormControl>
                            <FormDescription>
                                {t('formFields.price.description')}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('formFields.category.title')}</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value.toString()}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('formFields.category.placeholder')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {
                                        categories.map(category =>
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        )
                                    }
                                </SelectContent>
                            </Select>
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
                        food ?
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-500/80 text-white">{t('dialog.edit')}</Button>
                            :
                            <Button type="submit">{t('dialog.create')}</Button>
                    }
                </DialogFooter>
            </form>
        </Form>
    )
}