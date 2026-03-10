import { z } from 'zod'

import { PrinterResponseSchema } from "./printer.schema"

const CashRegisterBase = {
    name: z.string().min(1).meta({
        description: "Name of the cash register",
        example: "Register 1"
    }),
    enabled: z.boolean().meta({
        description: "Whether the cash register is active"
    }),
    defaultPrinterId: z.cuid().meta({
        description: "Default printer identifier for receipts"
    })
}

export const CreateCashRegisterSchema = z.object({
    ...CashRegisterBase,
    enabled: CashRegisterBase.enabled.default(true)
}).meta({
    id: "CreateCashRegisterRequest",
    description: "Payload required to create a new cash register"
})

export const UpdateCashRegisterSchema = z.object({
    ...CashRegisterBase
}).meta({
    id: "UpdateCashRegisterRequest",
    description: "Payload required to update a cash register"
})

export const PatchCashRegisterSchema = z.object({
    enabled: z.boolean().meta({
        description: "New enabled state"
    })
}).meta({
    id: "PatchCashRegisterRequest",
    description: "Payload required to patch a cash register"
})

export const GetCashRegisterQuerySchema = z.object({
    include: z.enum(["printer"]).optional().meta({
        description: "Relations to include in response"
    }),
    enabled: z.enum(["true", "false"]).transform((value) => value === "true")
        .optional().meta({
            description: "Filter by enabled status"
        }),
}).meta({
    id: "GetCashRegisterQuery",
    description: "Query parameters for retrieving cash registers"
})

export const CashRegisterResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the cash register"
    }),
    ...CashRegisterBase,
    defaultPrinter: PrinterResponseSchema.optional()
}).meta({
    id: "CashRegisterResponse",
    description: "Cash register entity with all details"
})

export type CreateCashRegisterInput = z.infer<typeof CreateCashRegisterSchema>
export type UpdateCashRegisterInput = z.infer<typeof UpdateCashRegisterSchema>
export type PatchCashRegister = z.infer<typeof PatchCashRegisterSchema>
export type GetCashRegisterQueryParams = z.infer<typeof GetCashRegisterQuerySchema>
export type CashRegisterResponse = z.infer<typeof CashRegisterResponseSchema>
