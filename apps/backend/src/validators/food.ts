import z from "zod"

import { idSchema } from "./params"

export const foodSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(0).optional(),
    price: z.number().min(0.01),
    available: z.boolean(),
    categoryId: idSchema
})