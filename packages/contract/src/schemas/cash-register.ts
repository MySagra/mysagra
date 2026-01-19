import z from "zod"
import { PrinterResponseSchema } from "./printer"
import { registry } from "../registry"

const CashRegisterBaseSchema = z.object({
    name: z.string().min(1).max(100).describe("Name of the cash register"),
    enabled: z.boolean().describe("Whether the cash register is active"),
    defaultPrinterId: z.cuid().describe("ID of the default printer for this cash register")
})

export const CreateCashRegisterRequestSchema = z.object({
    ...CashRegisterBaseSchema.shape,
    enabled: CashRegisterBaseSchema.shape.enabled.default(true)
}).openapi("CreateCashRegisterRequest", {
    description: "Request body for creating a new cash register",
    example: {
        name: "Main Register",
        enabled: true,
        defaultPrinterId: "clh1234567890abcdef"
    }
})

export const UpdateCashRegisterRequestSchema = z.object({
    ...CashRegisterBaseSchema.shape
}).openapi("UpdateCashRegisterRequest", {
    description: "Request body for updating a cash register",
    example: {
        name: "Updated Register",
        enabled: true,
        defaultPrinterId: "clh1234567890abcdef"
    }
})

export const PatchCashRegisterRequestSchema = z.object({
    enabled: z.boolean().describe("Whether the cash register is active")
}).openapi("PatchCashRegisterRequest", {
    description: "Request body for partially updating a cash register",
    example: {
        enabled: false
    }
})

export const GetCashRegisterQuerySchema = z.object({
    include: z.enum(["printer"]).optional().describe("Include related printer data"),
    enabled: z.enum(["true", "false"]).transform((value) => value === "true")
        .optional().describe("Filter by enabled status"),
})

export const CashRegisterResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the cash register"),
    ...CashRegisterBaseSchema.shape,
    defaultPrinter: PrinterResponseSchema.optional().describe("The default printer associated with this cash register")
}).openapi("CashRegisterResponse", {
    description: "Cash register data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        name: "Main Register",
        enabled: true,
        defaultPrinterId: "clh0987654321fedcba"
    }
})

export type CreateCashRegisterRequest = z.infer<typeof CreateCashRegisterRequestSchema>
export type UpdateCashRegisterRequest = z.infer<typeof UpdateCashRegisterRequestSchema>
export type PatchCashRegisterRequest = z.infer<typeof PatchCashRegisterRequestSchema>
export type GetCashRegisterQueryParams = z.infer<typeof GetCashRegisterQuerySchema>
export type CashRegisterResponse = z.infer<typeof CashRegisterResponseSchema>

registry.register("CreateCashRegisterRequest", CreateCashRegisterRequestSchema)
registry.register("UpdateCashRegisterRequest", UpdateCashRegisterRequestSchema)
registry.register("PatchCashRegisterRequest", PatchCashRegisterRequestSchema)
registry.register("CashRegisterResponse", CashRegisterResponseSchema)
