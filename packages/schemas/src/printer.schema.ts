
import { z } from 'zod'

const PrinterEnum = z.enum(["ONLINE", "OFFLINE", "ERROR"]).meta({
    id: "PrinterStatus",
    description: "Printer operational status",
    example: "ONLINE"
})

const PrinterBase = {
    name: z.string().min(1).meta({
        description: "Name of the printer",
        example: "Kitchen Printer"
    }),
    ip: z.ipv4().meta({
        description: "IPv4 address of the printer",
        example: "192.168.1.100"
    }),
    port: z.number().int().min(0).max(65535).default(9100).meta({
        description: "Port number for printer communication",
        example: 9100
    }),
    description: z.string().optional().meta({
        description: "Optional description of the printer's location or purpose"
    }),
    status: PrinterEnum.default("ONLINE").meta({
        description: "Current operational status"
    })
}

export const CreatePrinterSchema = z.object({
    ...PrinterBase,
    port: PrinterBase.port.optional(),
    status: PrinterBase.status.optional()
}).meta({
    id: "CreatePrinterRequest",
    description: "Payload required to create a new printer"
})

export const UpdatePrinterSchema = z.object({
    ...PrinterBase,
    description: z.string().meta({
        description: "Required description for update the printer"
    })
}).meta({
    id: "UpdatePrinterRequest",
    description: "Payload required to update a printer"
})

export const PatchPrinterSchema = z.object({
    status: PrinterEnum.meta({
        description: "New status for the printer"
    })
}).meta({
    id: "PatchPrinterRequest",
    description: "Payload required to patch a printer's status"
})

export const PrinterResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the printer"
    }),
    ...PrinterBase
}).meta({
    id: "PrinterResponse",
    description: "Printer entity with all details"
})

export type CreatePrinterInput = z.infer<typeof CreatePrinterSchema>
export type UpdatePrinterInput = z.infer<typeof UpdatePrinterSchema>
export type PatchPrinterInput = z.infer<typeof PatchPrinterSchema>
export type PrinterResponse = z.infer<typeof PrinterResponseSchema>
