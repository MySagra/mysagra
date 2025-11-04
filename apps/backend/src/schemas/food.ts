import z from "zod"
import { cuidParamSchema, idParamSchema } from "./params";

const foodIngredient = z.object({
    id: z.string().cuid()
})

export const foodSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(0).optional(),
    price: z.number().min(0.01),
    available: z.boolean(),
    categoryId: z.number().int().min(1),
    ingredients: z.array(foodIngredient).optional().refine(
        (ingredients) => {
            if (!ingredients) return true;
            const ids = ingredients.map(ing => ing.id);
            return ids.length === new Set(ids).size;
        },
        {
            message: "Ingredients cannot contain duplicates with the same id"
        }
    )
})

export const getFoodQuerySchema = z.object({
    include: z.enum(['ingredients']).optional()
})

export type FoodIngredient = z.infer<typeof foodIngredient>
export type Food = z.infer<typeof foodSchema>
export type GetFoodQuery = z.infer<typeof getFoodQuerySchema>;
export type GetFoodParams = z.infer<typeof cuidParamSchema>;
