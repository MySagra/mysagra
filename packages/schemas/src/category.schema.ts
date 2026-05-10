import { z } from 'zod'

import { FoodResponseSchema } from "./food.schema"

const CategoryBase = {
    name: z.string().min(1).max(100).meta({
        description: "Category name",
        example: "Pizzas"
    }),
    available: z.boolean().meta({
        description: "Whether category items are available for ordering"
    }),
    position: z.number().int().meta({
        description: "Display position/order priority",
        example: 1
    }),
    printerId: z.cuid().nullish().meta({
        description: "Associated printer identifier for category orders"
    }),
    stationId: z.cuid().nullable().meta({
        description: "Associated station identifier"
    })
}

export const CreateCategorySchema = z.object({
    ...CategoryBase,
    printerId: CategoryBase.printerId.optional()
}).meta({
    id: "CreateCategoryRequest",
    description: "Payload required to create a new category"
})

export const UpdateCategorySchema = z.object({
    ...CategoryBase,
    printerId: CategoryBase.printerId.optional()
}).meta({
    id: "UpdateCategoryRequest",
    description: "Payload required to update a category"
})

export const PatchCategorySchema = z.object({
    available: z.boolean().optional().meta({
        description: "Update availability status"
    }),
    printerId: CategoryBase.printerId.optional().nullable().meta({
        description: "Update associated printer"
    }),
    stationId: z.cuid().optional().nullable().meta({
        description: "Associated station identifier"
    })
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
}).meta({
    id: "PatchCategoryRequest",
    description: "Payload to partially update a category"
})

export const UploadCategoryImageSchema = z.object({
    image: z.any().meta({
        description: "Category image file"
    })
}).meta({
    id: "UploadCategoryImageRequest",
    description: "Multipart payload for uploading category image"
})

export const GetCategoriesQuerySchema = z.object({
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional().meta({
        description: "Filter by availability"
    }),
    include: z.enum(['foods', 'foods.ingredients'])
        .optional()
        .meta({
            description: "Relations to include. 'foods.ingredients' includes both levels."
        }),
    foodsAvailable: z.enum(['true', 'false', 'all'])
        .optional()
        .default('all')
        .transform((val) => {
            if (val === 'all') return undefined; // 'undefined' tells Prisma not to filter
            return val === 'true';
        })
        .meta({ description: "Filter included foods: true (available), false (unavailable), all" })
}).meta({
    id: "GetCategoriesQuery",
    description: "Query parameters for listing categories"
})

export const GetCategoryQuerySchema = z.object({
    include: z.enum(['foods', 'foods.ingredients'])
        .optional()
        .meta({
            description: "Relations to include. 'foods.ingredients' includes both levels."
        })
}).meta({
    id: "GetCategoryQuery",
    description: "Query parameters for retrieving a single category"
})

export const CategoryResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the category"
    }),
    ...CategoryBase,
    image: z.url().nullish().meta({
        description: "URL to category image"
    }),
    foods: z.array(FoodResponseSchema).optional().meta({
        description: "Category's food items"
    })
}).meta({
    id: "CategoryResponse",
    description: "Category entity with optional foods"
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
export type PatchCategoryInput = z.infer<typeof PatchCategorySchema>
export type UploadCategoryImageInput = z.infer<typeof UploadCategoryImageSchema>
export type GetCategoriesQuery = z.infer<typeof GetCategoriesQuerySchema>
export type GetCategoryQuery = z.infer<typeof GetCategoryQuerySchema>
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>
