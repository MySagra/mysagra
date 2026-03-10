import { z } from 'zod'
import 'zod-openapi'
import { IngredientResponseSchema } from "./ingredient.schema"

const FoodIngredientInputSchema = z.object({
    id: z.cuid().meta({
        description: "Ingredient identifier"
    })
}).meta({
    id: "FoodIngredient",
    description: "Reference to an ingredient in a food item"
})

const FoodBase = {
    name: z.string().min(1).meta({
        description: "Food item name",
        example: "Margherita Pizza"
    }),
    description: z.string().optional().meta({
        description: "Food item description"
    }),
    price: z.number().min(0.01).meta({
        description: "Price in currency units",
        example: 12.99
    }),
    available: z.boolean().default(true).meta({
        description: "Whether item is available for ordering"
    }),
    categoryId: z.cuid().meta({
        description: "Category identifier"
    }),
    printerId: z.cuid().nullish().optional().meta({
        description: "Optional specific printer for this item"
    }),
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
        ).meta({
            description: "Associated ingredients"
        })
}

export const CreateFoodSchema = z.object({
    ...FoodBase,
}).meta({
    id: "CreateFoodRequest",
    description: "Payload required to create a new food item"
})

export const UpdateFoodSchema = z.object({
    ...FoodBase,
    description: z.string().meta({
        description: "Required food description"
    }),
    ingredients: FoodBase.ingredients.optional()
}).meta({
    id: "UpdateFoodRequest",
    description: "Payload required to update a food item"
})

export const PatchFoodSchema = z.object({
    available: z.boolean().optional().meta({
        description: "Update availability status"
    }),
    printerId: z.cuid().nullable().optional().meta({
        description: "Update assigned printer"
    })
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
}).meta({
    id: "PatchFoodRequest",
    description: "Payload to partially update a food item"
})

export const GetFoodsQuerySchema = z.object({
    include: z.enum(['ingredients']).optional().meta({
        description: "Relations to include"
    }),
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional().meta({
        description: "Filter by availability"
    }),
    category: z.union([z.string(), z.array(z.string())]).optional()
        .transform(val => {
            if (val === undefined) return undefined;
            return Array.isArray(val) ? val : [val];
        }).meta({
            description: "Filter by category ID(s)"
        })
}).meta({
    id: "GetFoodsQuery",
    description: "Query parameters for listing food items"
})

export const GetFoodQuerySchema = z.object({
    include: z.enum(['ingredients']).optional().meta({
        description: "Relations to include"
    })
}).meta({
    id: "GetFoodQuery",
    description: "Query parameters for retrieving a single food item"
})

export const FoodResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the food item"
    }),
    ...FoodBase,
    ingredients: z.array(IngredientResponseSchema).nullish().meta({
        description: "Associated ingredients"
    })
}).meta({
    id: "FoodResponse",
    description: "Food item entity with optional ingredients"
})

export type CreateFoodInput = z.infer<typeof CreateFoodSchema>
export type UpdateFoodInput = z.infer<typeof UpdateFoodSchema>
export type PatchFoodInput = z.infer<typeof PatchFoodSchema>
export type GetFoodsQueryParams = z.infer<typeof GetFoodsQuerySchema>;
export type GetFoodQueryParams = z.infer<typeof GetFoodQuerySchema>;
export type FoodResponse = z.infer<typeof FoodResponseSchema>;