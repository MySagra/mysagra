import z from "zod"
import { idSchema } from "./params"

const foodsOrderedSchema = z.object({
    foodId: idSchema,
    quantity: z.number().int().min(1)
})

export const orderSchema = z.object({
    table: z.number().min(0),
    customer: z.string().min(1),
    foodsOrdered: z.array(foodsOrderedSchema)
})