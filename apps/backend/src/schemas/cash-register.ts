import z from "zod"
import {PrinterResponseSchema} from "@/schemas/printer";

const CashRegisterBase = {
    name: z.string().min(1),
    enabled: z.boolean(),
    defaultPrinterId: z.string().cuid()
}

export const CreateCashRegisterSchema = z.object({
    ...CashRegisterBase,
    enabled: CashRegisterBase.enabled.default(true)
})

export const UpdateCashRegisterSchema = z.object({
    ...CashRegisterBase
})

export const PatchCashRegisterSchema = z.object({
    enabled: z.boolean()
})

export const GetCashRegisterQuerySchema = z.object({
    include: z.enum(["printer"]).optional(),
    enabled: z.enum(["true", "false"]).transform((value) => value === "true")
        .optional(),
})

export const CashRegisterResponseSchema = z.object({
    id: z.string().cuid(),
    ...CashRegisterBase,
    defaultPrinter: PrinterResponseSchema.optional()
})

export type CreateCashRegisterInput = z.infer<typeof CreateCashRegisterSchema>
export type UpdateCashRegisterInput = z.infer<typeof UpdateCashRegisterSchema>
export type PatchCashRegister = z.infer<typeof PatchCashRegisterSchema>
export type GetCashRegisterQueryParams = z.infer<typeof GetCashRegisterQuerySchema>
export type CashRegisterResponse = z.infer<typeof CashRegisterResponseSchema>
