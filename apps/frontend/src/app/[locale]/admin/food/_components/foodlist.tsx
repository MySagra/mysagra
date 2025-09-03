'use client'

import { Button } from "@/components/ui/button";
import { Food } from "@/types/food";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { FoodDialog } from "./foodDialog";
import { Category } from "@/types/category";
import { DialogAction } from "@/components/ui/dialogAction";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface FoodListProps {
    initialFoods: Array<Food>
    categories: Array<Category>
}

export function FoodList({ initialFoods, categories }: FoodListProps) {
    const [foods, setFoods] = useState(initialFoods);

    return (
        <div className="flex flex-col gap-3 px-4 lg:px-6">
            <FoodDialog setFoods={setFoods} categories={categories} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {
                    foods.map(food => (
                        <FoodCard key={food.id} food={food} setFoods={setFoods} categories={categories} />
                    ))
                }
            </div>
        </div>
    )
}

interface FoodCardProps {
    food: Food
    setFoods: React.Dispatch<React.SetStateAction<Food[]>>
    categories: Array<Category>
}

function FoodCard({ food, setFoods, categories }: FoodCardProps) {
    const t = useTranslations('Food')
    const [show, setShow] = useState<boolean>(food.available || false)

    function deleteFood() {
        fetch(`/api/foods/${food.id}`, {
            method: "DELETE",
            credentials: "include"
        }).then(async res => {
            await res.json();
            if (res.ok) {
                setFoods(prev => prev.filter(f => f.id !== food.id));
            }
        }).then(() => {
            toast.success(t('toast.deleteSuccess'));
        }).catch(err => {
            toast.error(t('toast.deleteError'));
            console.error(err);
        })
    }

    function handleAvailable() {
        fetch(`/api/foods/available/${food.id}`, {
            method: "PATCH",
            credentials: "include"
        }).then(async res => {
            await res.json();
            if (res.ok) {
                setShow(!show);
            }
        });
    }

    return (
        <div className="bg-secondary p-3 rounded-md flex place-content-between">
            <div className="flex flex-row gap-1.5 items-center">
                <DialogAction
                    title={t('delete.title')}
                    variant={'destructive'}
                    action={() => deleteFood()}
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
                <Button size={"icon"} variant={"ghost"} onClick={() => handleAvailable()}>
                    {
                        show ?
                            <Eye />
                            :
                            <EyeOff />
                    }
                </Button>
                <FoodDialog food={food} setFoods={setFoods} setShow={setShow} categories={categories} />
            </div>
        </div>
    )
}