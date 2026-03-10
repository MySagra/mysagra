import { z } from 'zod'
import 'zod-openapi'

const IngredientBase = {
    name: z.string().min(1).meta({
        description: "Name of the ingredient",
        example: "Tomato"
    })
}

export const CreateIngredientSchema = z.object({
    ...IngredientBase
}).meta({
    id: "CreateIngredientRequest",
    description: "Payload required to create a new ingredient"
})

export const UpdateIngredientSchema = z.object({
    ...IngredientBase
}).meta({
    id: "UpdateIngredientRequest",
    description: "Payload required to update an ingredient"
})

export const IngredientResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the ingredient"
    }),
    ...IngredientBase
}).meta({
    id: "IngredientResponse",
    description: "Ingredient entity with identifier"
})

export type CreateIngredientInput = z.infer<typeof CreateIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>;
export type IngredientResponse = z.infer<typeof IngredientResponseSchema>;