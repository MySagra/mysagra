import z from "zod";

export const orderIdParamSchema = z.object({
    id: z.string().regex(/^[A-Z0-9]+$/, "Order ID must contain only uppercase letters and numbers")
})

export const idParamSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1))
});

export const pageParamSchema = z.object({
    page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(0))
});