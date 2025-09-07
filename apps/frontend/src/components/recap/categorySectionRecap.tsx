import { Category } from "@/types/category"
import { TableCell, TableRow } from "../ui/table"
import FoodRowRecap from "./foodRowRecap"
import { FoodsOrderd } from "@/types/foodOrdered"
import { useEffect, useState } from "react"

interface Props {
    category: Category,
    foodsOrderd: Array<FoodsOrderd>
    className?: string
    smallView?: boolean
}

import { cn } from "@/lib/utils"

export default function CategorySectionRecap({ category, foodsOrderd, className, smallView = false }: Props) {
    const [foods, setFoods] = useState<Array<FoodsOrderd>>([]);

    useEffect(() => {
        foodsOrderd.map(foodOrder => {
            if (foodOrder.food.categoryId === category.id || foodOrder.food.category?.id === category.id) {
                setFoods(prevFoods => [...prevFoods, foodOrder]);
            }
        })
    }, [category.id, foodsOrderd])

    if (foods.length === 0) {
        return <></>
    }
    else {
        return (
            <>
                <TableRow className={cn("bg-white", className)}>
                    <TableCell className="font-bold text-lg">
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                    </TableCell>
                    {
                        smallView ? <></> : <TableCell></TableCell>
                    }
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                </TableRow>
                {
                    foodsOrderd
                        .filter(foodOrder =>
                            foodOrder.food.categoryId === category.id ||
                            foodOrder.food.category?.id === category.id
                        )
                        .map(foodOrder => (
                            <FoodRowRecap
                                key={foodOrder.food.id}
                                food={foodOrder.food}
                                quantity={foodOrder.quantity}
                                smallView={smallView}
                            />
                        ))
                }
            </>
        )
    }


}