import { includes, z } from "zod"
import { CategoryResponseSchema } from "./category.schema"

export const StationInputSchema = z.object({
    name: z.string().meta({
        description: "Postation name",
        example: "Pizza and Kitchen"
    })
})

export const StationResponseSchema = StationInputSchema.extend({
    id: z.cuid().meta({
        description: "Unique identifier of the Station role"
    }),
    categories: z.array(CategoryResponseSchema).optional().meta({
        description: "Station's categories"
    })
})

export const GetStationQuerySchema = z.object({
    include: z.enum(['categories', 'categories.foods', 'categories.foods.ingredients'])
        .optional()
        .meta({
            description: "Relations to include. 'categories.foods' includes both levels."
        })
})

export type StationInput = z.infer<typeof StationInputSchema>
export type StationResponse = z.infer<typeof StationResponseSchema>
export type GetStationQuery = z.infer<typeof GetStationQuerySchema>