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

interface CategoriesPositionProps {
    initialCategories: Array<Category>
    imageURL: string
}

export default function CategoriesList({ initialCategories, imageURL }: CategoriesPositionProps) {
    const [categories, setCategories] = useState(initialCategories);
    return (
        <div className="px-4 lg:px-6 flex flex-col gap-3">
            <CategoryDialog setCategories={setCategories} />
            <div className="flex flex-col gap-1">
                {
                    categories.map((category) => (
                        <CategoryCard key={category.id} setCategories={setCategories} category={category} imageURL={category.image ? `${imageURL}/${category.image}` : undefined} />
                    ))
                }
            </div>
        </div>
    )
}

interface CategoryCardProps {
    category: Category
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>
    imageURL?: string
}

function CategoryCard({ category, setCategories, imageURL }: CategoryCardProps) {
    const [show, setShow] = useState<boolean>(category.available);
    const t = useTranslations('Category')

    function handleAvailable() {
        fetch(`/api/categories/available/${category.id}`, {
            method: "PATCH",
            credentials: "include"
        }).then(async res => {
            await res.json();
            if (res.ok) {
                setShow(!show);
            }
        });
    }

    function deleteCategory() {
        fetch(`/api/categories/${category.id}`, {
            method: "DELETE",
            credentials: "include"
        }).then(async res => {
            await res.json();
            if (res.ok) {
                setCategories(prev => prev.filter(c => c.id !== category.id));
            }
        }).then(() => {
            toast.success(t('toast.deleteSuccess'));
        }).catch(err => {
            toast.error(t('toast.deleteError'));
            console.error(err);
        });
    }

        

    return (
        <div className="w-full flex place-content-center">
            <div className="bg-secondary p-3 rounded-sm flex flex-row gap-3 place-content-between w-[400px] items-center">
                <div className="flex flex-row gap-1 items-center">
                    <DialogAction
                        title={t('delete.title')}
                        variant={'destructive'}
                        action={() => deleteCategory()}
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
                    <CategoryDialog category={category} setCategories={setCategories} setShow={setShow} imageURL={imageURL} />
                </div>
            </div>
        </div>
    )
}