import z from "zod"

export const printerSchema = z.object({
    name: z.string().min(1),
    ip: z.string().ip({ version: "v4" }),
    port: z.number().int().min(0).max(65535).optional(),
    description: z.string().optional()
})

export type Printer = z.infer<typeof printerSchema>