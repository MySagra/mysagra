import z from "zod";

export const idSchema = z.number().int().min(0)
export const pageSchema = z.number().int().min(0)

export const idParamSchema = z.object({
    id: idSchema
});

export const pageParamSchema = z.object({
    page: pageSchema
})