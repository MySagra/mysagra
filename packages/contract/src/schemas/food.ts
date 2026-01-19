import z from "zod"
import { IngredientResponseSchema } from "./ingredient";
import { registry } from "../registry";

const FoodIngredientInputSchema = z.object({
    id: z.cuid().describe("ID of the ingredient to associate")
})

const FoodBaseSchema = z.object({
    name: z.string().min(1).max(100).describe("Name of the food item"),
    description: z.string().min(0).nullish().describe("Optional description of the food item"),
    price: z.number().min(0.01).describe("Price of the food item"),
    available: z.boolean().describe("Whether the food item is available for ordering"),
    categoryId: z.cuid().describe("ID of the category this food belongs to"),
    printerId: z.cuid().nullish().optional().describe("ID of the printer for this food item")
})

export const CreateFoodRequestSchema = z.object({
    ...FoodBaseSchema.shape,
    description: FoodBaseSchema.shape.description.optional(),
    available: FoodBaseSchema.shape.available.default(true),
    ingredients: z.array(FoodIngredientInputSchema)
        .optional()
        .describe("List of ingredient IDs to associate with this food")
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
}).openapi("CreateFoodRequest", {
    description: "Request body for creating a new food item",
    example: {
        name: "Margherita Pizza",
        description: "Classic tomato and mozzarella pizza",
        price: 8.50,
        available: true,
        categoryId: "clh1234567890abcdef",
        ingredients: [{ id: "clh0987654321fedcba" }]
    }
})

export const UpdateFoodRequestSchema = z.object({
    ...FoodBaseSchema.shape,
    ingredients: z.array(FoodIngredientInputSchema).optional().describe("List of ingredient IDs")
}).openapi("UpdateFoodRequest", {
    description: "Request body for updating a food item",
    example: {
        name: "Margherita Pizza Large",
        description: "Classic tomato and mozzarella pizza - large size",
        price: 12.50,
        available: true,
        categoryId: "clh1234567890abcdef"
    }
})

export const PatchFoodRequestSchema = z.object({
    available: z.boolean().optional().describe("Whether the food item is available"),
    printerId: z.cuid().describe("ID of the printer for this food item")
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
}).openapi("PatchFoodRequest", {
    description: "Request body for partially updating a food item",
    example: {
        available: false
    }
})

export const GetFoodsQuerySchema = z.object({
    include: z.enum(['ingredients']).optional().describe("Include related ingredients"),
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional().describe("Filter by availability"),
    category: z.union([z.string(), z.array(z.string())]).optional()
        .describe("Filter by category ID(s)")
        .transform(val => {
            if (val === undefined) return undefined;
            return Array.isArray(val) ? val : [val];
        })
})

export const GetFoodQuerySchema = z.object({
    include: z.enum(['ingredients']).optional().describe("Include related ingredients"),
})

export const FoodResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the food item"),
    ...FoodBaseSchema.shape,
    ingredients: z.array(IngredientResponseSchema).nullish().describe("List of ingredients in this food")
}).openapi("FoodResponse", {
    description: "Food item data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        name: "Margherita Pizza",
        description: "Classic tomato and mozzarella pizza",
        price: 8.50,
        available: true,
        categoryId: "clh0987654321fedcba",
        printerId: null,
        ingredients: [{ id: "clhingredient12345", name: "Mozzarella" }]
    }
})

export type CreateFoodRequest = z.infer<typeof CreateFoodRequestSchema>
export type UpdateFoodRequest = z.infer<typeof UpdateFoodRequestSchema>
export type PatchFoodRequest = z.infer<typeof PatchFoodRequestSchema>
export type GetFoodsQueryParams = z.infer<typeof GetFoodsQuerySchema>
export type GetFoodQueryParams = z.infer<typeof GetFoodQuerySchema>
export type FoodResponse = z.infer<typeof FoodResponseSchema>

registry.register("CreateFoodRequest", CreateFoodRequestSchema)
registry.register("UpdateFoodRequest", UpdateFoodRequestSchema)
registry.register("PatchFoodRequest", PatchFoodRequestSchema)
registry.register("FoodResponse", FoodResponseSchema)