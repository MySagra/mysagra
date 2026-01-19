import z from "zod"
import { registry } from "../registry"

const PrinterStatusSchema = z.enum(["ONLINE", "OFFLINE", "ERROR"])
    .describe("Current status of the printer")
    .openapi("PrinterStatus", {
        description: "Possible printer statuses",
        example: "ONLINE"
    })

const PrinterBaseSchema = z.object({
    name: z.string().min(1).max(100).describe("Name of the printer"),
    ip: z.ipv4().describe("IPv4 address of the printer"),
    port: z.number().int().min(0).max(65535).default(9100).describe("Network port of the printer"),
    description: z.string().optional().describe("Optional description of the printer"),
    status: PrinterStatusSchema.default("ONLINE")
})

export const CreatePrinterRequestSchema = z.object({
    ...PrinterBaseSchema.shape
}).openapi("CreatePrinterRequest", {
    description: "Request body for creating a new printer",
    example: {
        name: "Kitchen Printer",
        ip: "192.168.1.100",
        port: 9100,
        description: "Main kitchen thermal printer",
        status: "ONLINE"
    }
})

export const UpdatePrinterRequestSchema = z.object({
    ...PrinterBaseSchema.shape
}).openapi("UpdatePrinterRequest", {
    description: "Request body for updating a printer",
    example: {
        name: "Kitchen Printer Updated",
        ip: "192.168.1.101",
        port: 9100,
        description: "Updated kitchen printer",
        status: "ONLINE"
    }
})

export const PatchPrinterRequestSchema = z.object({
    status: PrinterStatusSchema
}).openapi("PatchPrinterRequest", {
    description: "Request body for partially updating a printer status",
    example: {
        status: "OFFLINE"
    }
})

export const PrinterResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the printer"),
    ...PrinterBaseSchema.shape
}).openapi("PrinterResponse", {
    description: "Printer data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        name: "Kitchen Printer",
        ip: "192.168.1.100",
        port: 9100,
        description: "Main kitchen thermal printer",
        status: "ONLINE"
    }
})

export type CreatePrinterRequest = z.infer<typeof CreatePrinterRequestSchema>
export type UpdatePrinterRequest = z.infer<typeof UpdatePrinterRequestSchema>
export type PatchPrinterRequest = z.infer<typeof PatchPrinterRequestSchema>
export type PrinterResponse = z.infer<typeof PrinterResponseSchema>

registry.register("CreatePrinterRequest", CreatePrinterRequestSchema)
registry.register("UpdatePrinterRequest", UpdatePrinterRequestSchema)
registry.register("PatchPrinterRequest", PatchPrinterRequestSchema)
registry.register("PrinterResponse", PrinterResponseSchema)