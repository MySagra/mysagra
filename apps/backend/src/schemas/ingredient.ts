import z from "zod"

export const ingredientSchema = z.object({
    name: z.string().min(1)
})

export type Ingredient = z.infer<typeof ingredientSchema>