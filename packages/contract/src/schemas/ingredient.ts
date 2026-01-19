import z from "zod"
import { registry } from "../registry"

const IngredientBaseSchema = z.object({
    name: z.string().min(1).max(100).describe("Name of the ingredient"),
})

export const CreateIngredientRequestSchema = z.object({
    ...IngredientBaseSchema.shape
}).openapi("CreateIngredientRequest", {
    description: "Request body for creating a new ingredient",
    example: {
        name: "Mozzarella"
    }
})

export const UpdateIngredientRequestSchema = z.object({
    ...IngredientBaseSchema.shape
}).openapi("UpdateIngredientRequest", {
    description: "Request body for updating an ingredient",
    example: {
        name: "Fresh Mozzarella"
    }
})

export const IngredientResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the ingredient"),
    ...IngredientBaseSchema.shape
}).openapi("IngredientResponse", {
    description: "Ingredient data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        name: "Mozzarella"
    }
})

export type CreateIngredientRequest = z.infer<typeof CreateIngredientRequestSchema>
export type UpdateIngredientRequest = z.infer<typeof UpdateIngredientRequestSchema>
export type IngredientResponse = z.infer<typeof IngredientResponseSchema>

registry.register("CreateIngredientRequest", CreateIngredientRequestSchema)
registry.register("UpdateIngredientRequest", UpdateIngredientRequestSchema)
registry.register("IngredientResponse", IngredientResponseSchema)