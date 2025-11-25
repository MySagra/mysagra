import z from "zod"

export const cashRegisterSchema = z.object({
    name: z.string().min(1),
    enabled: z.boolean().optional(),
    defaultPrinterId: z.string().cuid()
})

export const patchCashRegisterSchema = z.object({
    enabled: z.boolean()
})

export const getCashRegisterQuerySchema = z.object({
    include: z.enum(["printer"]).optional()
})

export type CashRegister = z.infer<typeof cashRegisterSchema>
export type GetCashRegisterQuery = z.infer<typeof getCashRegisterQuerySchema>
export type PatchCashRegister = z.infer<typeof patchCashRegisterSchema>