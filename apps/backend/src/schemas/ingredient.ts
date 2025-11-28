import z from "zod"

const IngredientBase = {
    name: z.string().min(1),
}

export const CreateIngredientSchema = z.object({
    ...IngredientBase
})

export const UpdateIngredientSchema = z.object({
    ...IngredientBase
})

export const IngredientResponseSchema = z.object({
    id: z.string().cuid(),
    ...IngredientBase
})

export type CreateIngredientInput = z.infer<typeof CreateIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>;
export type IngredientResponse = z.infer<typeof IngredientResponseSchema>;