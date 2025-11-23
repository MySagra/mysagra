import z from "zod"

export const categorySchema = z.object({
    name: z.string().min(1),
    available: z.boolean(),
    position: z.number().int()
})

export const getCategoriesQuerySchema = z.object({
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    include: z.enum(['foods']).optional()
})

export const getCategoryQuerySchema = z.object({
    include: z.enum(['foods'])
})

export const patchCategorySchema = z.object({
    available: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
})

export type Category = z.infer<typeof categorySchema>
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>
export type GetCategoryQuery = z.infer<typeof getCategoryQuerySchema>
export type PatchCategory = z.infer<typeof patchCategorySchema>