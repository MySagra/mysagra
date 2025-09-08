import z from "zod"

export const categorySchema = z.object({
    name: z.string().min(1),
    available: z.boolean(),
    position: z.number().int()
})

export const idCategorySchema = z.object({
    id: z.number().int().positive()
})