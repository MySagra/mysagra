import z from "zod";

export const idParamSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1))
});

export const cuidParamSchema = z.object({
    id: z.string().cuid()
});

export type CUIDParam = z.infer<typeof cuidParamSchema>
export type NumberIdParam = z.infer<typeof idParamSchema>