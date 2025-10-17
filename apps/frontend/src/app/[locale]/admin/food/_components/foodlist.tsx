'use client'

import { Button } from "@/components/ui/button";
import { Food } from "@/types/food";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { FoodDialog } from "./foodDialog";
import { Category } from "@/types/category";
import { DialogAction } from "@/components/ui/dialogAction";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFoods, useToggleFoodAvailability, useDeleteFood } from "@/hooks/api/food";

interface FoodListProps {
    categories: Array<Category>
}

export function FoodList({ categories }: FoodListProps) {
    const t = useTranslations('Food');
    const { data: foods, isLoading, isError } = useFoods();

    if (isLoading) {
        return <div className="text-center py-8">{t('loading')}</div>;
    }

    if (isError) {
        return <div className="text-center py-8 text-red-500">{t('loadingError')}</div>;
    }

    return (
        <div className="flex flex-col gap-3 px-4 lg:px-6">
            <FoodDialog categories={categories} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {
                    foods?.map(food => (
                        <FoodCard key={food.id} food={food} categories={categories} />
                    ))
                }
            </div>
        </div>
    )
}

interface FoodCardProps {
    food: Food
    categories: Array<Category>
}

function FoodCard({ food, categories }: FoodCardProps) {
    const t = useTranslations('Food');
    const { mutate: toggleAvailability } = useToggleFoodAvailability();
    const { mutate: deleteFoodMutation } = useDeleteFood();

    // Handler to delete a food
    const handleDeleteFood = () => {
        deleteFoodMutation(food.id, {
            onSuccess: () => {
                toast.success(t('toast.deleteSuccess'));
            },
            onError: (error) => {
                toast.error(t('toast.deleteError'));
                console.error(error);
            }
        });
    };

    // Handler to toggle food availability
    const handleToggleAvailability = () => {
        toggleAvailability(food.id, {
            onSuccess: () => {
                toast.success(t('availabilitySuccess'));
            },
            onError: (error) => {
                toast.error(t('availabilityError'));
                console.error(error);
            }
        });
    };

    return (
        <div className="bg-secondary p-3 rounded-md flex place-content-between">
            <div className="flex flex-row gap-1.5 items-center">
                <DialogAction
                    title={t('delete.title')}
                    variant={'destructive'}
                    action={handleDeleteFood}
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
                {food.name}
            </div>

            <div className="flex flex-row gap-1.5 items-center">
                <Button size={"icon"} variant={"ghost"} onClick={handleToggleAvailability}>
                    {
                        food.available ?
                            <Eye />
                            :
                            <EyeOff />
                    }
                </Button>
                <FoodDialog food={food} categories={categories} />
            </div>
        </div>
    )
}