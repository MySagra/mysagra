import { z } from "zod";

export const SagraSchema = z.object({
    id: z.cuid(),
    name: z.string(),

    lastClosingAt: z.date().optional(),
    statsIntervalMinutes: z.int().min(1).default(60)
})

export type Sagra = z.infer<typeof SagraSchema>