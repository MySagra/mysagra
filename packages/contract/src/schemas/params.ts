import z from "zod";
import { registry } from "../registry";

export const idParamSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1))
        .describe("Numeric ID parameter")
}).openapi("NumberIdParam", {
    description: "Path parameter for numeric IDs",
    example: {
        id: "123"
    }
});

export const cuidParamSchema = z.object({
    id: z.cuid().describe("CUID identifier")
}).openapi("CUIDParam", {
    description: "Path parameter for CUID identifiers",
    example: {
        id: "clh1234567890abcdef"
    }
});

export type CUIDParam = z.infer<typeof cuidParamSchema>
export type NumberIdParam = z.infer<typeof idParamSchema>

registry.register("NumberIdParam", idParamSchema)
registry.register("CUIDParam", cuidParamSchema)