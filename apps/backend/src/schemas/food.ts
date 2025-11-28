import z from "zod"
import { IngredientResponseSchema } from "@/schemas/ingredient";

const FoodIngredientInputSchema = z.object({
    id: z.string().cuid()
})

const FoodBase = {
    name: z.string().min(1),
    description: z.string().min(0).nullish(),
    price: z.number().min(0.01),
    available: z.boolean(),
    categoryId: z.string().cuid()
}

export const CreateFoodSchema = z.object({
    ...FoodBase,
    description: FoodBase.description.optional(),
    available: FoodBase.available.default(true),
    ingredients: z.array(FoodIngredientInputSchema)
        .optional()
        .refine(
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

export const UpdateFoodSchema = z.object({
    ...FoodBase,
    ingredients: z.array(FoodIngredientInputSchema).optional()
})

export const PatchFoodSchema = z.object({
    available: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
})

export const GetFoodsQuerySchema = z.object({
    include: z.enum(['ingredients']).optional(),
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    category: z.union([z.string(), z.array(z.string())]).optional()
        .transform(val => {
            if (val === undefined) return undefined;
            return Array.isArray(val) ? val : [val];
        })
})

export const GetFoodQuerySchema = z.object({
    include: z.enum(['ingredients']).optional(),
})

export const FoodResponseSchema = z.object({
    id: z.string().cuid(),
    ...FoodBase,
    ingredients: z.array(IngredientResponseSchema).nullish()
})

export type CreateFoodInput = z.infer<typeof CreateFoodSchema>
export type UpdateFoodInput = z.infer<typeof UpdateFoodSchema>
export type PatchFoodInput = z.infer<typeof PatchFoodSchema>
export type GetFoodsQueryParams = z.infer<typeof GetFoodsQuerySchema>;
export type GetFoodQueryParams = z.infer<typeof GetFoodQuerySchema>;
export type FoodResponse = z.infer<typeof FoodResponseSchema>;