import z from "zod"

export const categorySchema = z.object({
    name: z.string().min(1),
    available: z.boolean(),
    position: z.number().int()
})

export type Category = z.infer<typeof categorySchema>