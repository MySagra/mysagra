import { z } from 'zod'

// Money values are Decimal(10, 2) columns, serialized as strings to keep their precision.
export const decimalString = (description: string) =>
    z.string().regex(/^-?\d+(\.\d+)?$/).meta({ description, example: "12.5" })

export const idParamSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1)).meta({
        description: "Numeric identifier",
        example: "1"
    })
}).meta({
    id: "NumberIdParam",
    description: "Path parameter containing a numeric identifier"
})

export const cuidParamSchema = z.object({
    id: z.cuid().meta({
        description: "Unique CUID identifier"
    })
}).meta({
    id: "CUIDParam",
    description: "Path parameter containing a CUID identifier"
})

export type CUIDParam = z.infer<typeof cuidParamSchema>
export type NumberIdParam = z.infer<typeof idParamSchema>
