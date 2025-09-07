"use client"

import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Button } from "../ui/button"
import { Plus, Minus } from "lucide-react"

interface Prop {
    food: Food
}

import { useOrder } from "@/contexts/OrderContext";
import { useEffect, useState } from "react"
import { Food } from "@/types/food"
import { useTranslations } from "next-intl"

export default function FoodCard({ food }: Prop) {
    const t = useTranslations('Utils');
    const { order, setOrder } = useOrder();
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        const { foodsOrdered } = order;
        foodsOrdered.forEach(foodOrder => {
            if (foodOrder.food.id == food.id) {
                setCount(foodOrder.quantity);
            }
        })
    }, [food.id, order]);

    function sumFloats(a: number, b: number, decimals: number = 2): number {
        const factor = Math.pow(10, decimals);
        return Math.round((a + b) * factor) / factor;
    }

    function addFood() {
        setOrder(o => {
            // Cerca se il cibo è già stato ordinato
            const existing = o.foodsOrdered.find(foodOrder => foodOrder.food.id === food.id);
            let newFoodsOrdered;
            if (existing) {
                newFoodsOrdered = o.foodsOrdered.map(foodOrder =>
                    foodOrder.food.id === food.id
                        ? { ...foodOrder, quantity: foodOrder.quantity + 1 }
                        : foodOrder
                );
            } else {
                newFoodsOrdered = [
                    ...o.foodsOrdered,
                    { food: food, quantity: 1 }
                ];
            }
            return {
                ...o,
                price: sumFloats(Number(o.price), Number(food.price)),
                foodsOrdered: newFoodsOrdered
            };
        });

        setCount(count + 1);
    }

    function removeFood() {
        if (count === 0) return;

        setOrder(o => {
            const existing = o.foodsOrdered.find(foodOrder => foodOrder.food.id === food.id);
            if (!existing) return o;

            let newFoodsOrdered;
            if (existing.quantity === 1) {
                // Rimuovi il cibo dall'array se la quantità va a zero
                newFoodsOrdered = o.foodsOrdered.filter(foodOrder => foodOrder.food.id !== food.id);
            } else {
                // Decrementa la quantità
                newFoodsOrdered = o.foodsOrdered.map(foodOrder =>
                    foodOrder.food.id === food.id
                        ? { ...foodOrder, quantity: foodOrder.quantity - 1 }
                        : foodOrder
                );
            }

            return {
                ...o,
                price: Number(o.price) - Number(food.price),
                foodsOrdered: newFoodsOrdered
            };
        });

        setCount(count - 1);
    }

    return (
        <Card className=" shadow-xl">
            <CardHeader>
                <CardTitle className="flex flex-row place-content-between items-center text-3xl">
                    {food.name}
                </CardTitle>
                <CardDescription>
                    <p>{food.description || ""}</p>
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <div className="flex flex-row place-content-between w-full items-center">
                    <p className="text-2xl font-semibold text-yellow-700">
                        {
                            Number(food.price).toFixed(2) + t('currency')
                        }
                    </p>
                    <div className="flex flex-row gap-1.5 items-center">
                        <Button variant={"secondary"} size={"icon"} className=" rounded-full" onClick={() => removeFood()}>
                            <Minus />
                        </Button>
                        <p className="p-1 text-lg min-w-8 text-center">{count}</p>
                        <Button size={"icon"} variant={"secondary"} className="rounded-full" onClick={() => addFood()}>
                            <Plus />
                        </Button>
                    </div>

                </div>
            </CardFooter>
        </Card>

    )
}