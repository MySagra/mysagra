import z from "zod"

const PrinterBase = {
    name: z.string().min(1),
    ip: z.string().ip({ version: "v4" }),
    port: z.number().int().min(0).max(65535).default(9100),
    description: z.string().optional(),
    status: z.enum(["ONLINE", "OFFLINE", "ERROR"]).default("ONLINE"),
}

export const CreatePrinterSchema = z.object({
    ...PrinterBase,
    port: PrinterBase.port.optional(),
    status: PrinterBase.status.optional(),
})

export const UpdatePrinterSchema = z.object({
    ...PrinterBase
})

export const PatchPrinterSchema = z.object({
    status: z.enum(["ONLINE", "OFFLINE", "ERROR"])
})

export const PrinterResponseSchema = z.object({
    id: z.string().cuid(),
    ...PrinterBase
})

export type CreatePrinterInput = z.infer<typeof CreatePrinterSchema>
export type UpdatePrinterInput = z.infer<typeof UpdatePrinterSchema>
export type PatchPrinterInput = z.infer<typeof PatchPrinterSchema>
export type PrinterResponse = z.infer<typeof PrinterResponseSchema>