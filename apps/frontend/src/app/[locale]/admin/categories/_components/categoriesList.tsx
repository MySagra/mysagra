"use client"

import { useState } from "react";
import { Category } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import CategoryDialog from "./categoryDialog";
import { DialogAction } from "@/components/ui/dialogAction";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCategories, useToggleCategoryAvailability, useDeleteCategory } from "@/hooks/api/categories";

interface CategoriesPositionProps {
    imageURL: string
}

export default function CategoriesList({ imageURL }: CategoriesPositionProps) {
    const { data: categories, isFetching, isError } = useCategories();

    // Loading state
    if (isFetching) {
        return <div className="px-4 lg:px-6 flex place-content-center">Caricamento...</div>;
    }

    // Error state
    if (isError) {
        return <div className="px-4 lg:px-6 flex place-content-center text-destructive">Errore nel caricamento delle categorie</div>;
    }

    return (
        <div className="px-4 lg:px-6 flex flex-col gap-3">
            <CategoryDialog />
            <div className="flex flex-col gap-1">
                {
                    categories?.map((category) => (
                        <CategoryCard key={category.id} category={category} imageURL={category.image ? `${imageURL}/${category.image}` : undefined} />
                    ))
                }
            </div>
        </div>
    )
}

interface CategoryCardProps {
    category: Category
    imageURL?: string
}

function CategoryCard({ category, imageURL }: CategoryCardProps) {
    const [show, setShow] = useState<boolean>(category.available);
    const t = useTranslations('Category');
    const toggleAvailability = useToggleCategoryAvailability();
    const deleteCategory = useDeleteCategory();

    // Handle category availability toggle
    function handleAvailable() {
        toggleAvailability.mutate(category.id, {
            onSuccess: () => {
                setShow(!show);
                toast.success(t('toast.availabilitySuccess'));
            },
            onError: () => {
                toast.error(t('toast.availabilityError'));
            }
        });
    }

    // Handle category deletion
    function handleDelete() {
        deleteCategory.mutate(category.id, {
            onSuccess: () => {
                toast.success(t('toast.deleteSuccess'));
            },
            onError: () => {
                toast.error(t('toast.deleteError'));
            }
        });
    }

        

    return (
        <div className="w-full flex place-content-center">
            <div className="bg-secondary p-3 rounded-sm flex flex-row gap-3 place-content-between w-[400px] items-center">
                <div className="flex flex-row gap-1 items-center">
                    <DialogAction
                        title={t('delete.title')}
                        variant={'destructive'}
                        action={handleDelete}
                        buttonText={t('delete.buttonText')}
                        trigger={
                            <Button variant={'destructive'} size={"icon"} className="size-7">
                                <Trash2 />
                            </Button>
                        }
                    >
                        <p className="font-normal text-sm">
                            {t.rich('delete.description', {
                                strong: (chunk) => <span className="font-bold">{chunk}</span>
                            })}
                        </p>
                    </DialogAction>
                    <h1>
                        {category.name}
                    </h1>
                </div>

                <div className="flex flex-row gap-0.5 items-center">

                    <Button size={"icon"} variant={"ghost"} onClick={() => handleAvailable()}>
                        {
                            show ?
                                <Eye />
                                :
                                <EyeOff />
                        }
                    </Button>

                    <Separator
                        orientation="vertical"
                        className="mx-2 data-[orientation=vertical]:h-4"
                    />
                    <CategoryDialog category={category} setShow={setShow} imageURL={imageURL} />
                </div>
            </div>
        </div>
    )
}