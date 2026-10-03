import { z } from "zod";

export const SagraNameSchema = z.string().trim().min(1).max(100).meta({
    description: "Name of the sagra, shown to customers and cashiers",
    example: "Sagra della Polenta"
})

export const SagraSchema = z.object({
    id: z.cuid(),
    name: z.string().max(100),

    lastClosingAt: z.date().optional(),
    statsIntervalMinutes: z.int().min(1).default(60)
})

export type Sagra = z.infer<typeof SagraSchema>