import z from "zod"

import { FoodResponseSchema } from "@/schemas/food";

const CategoryBase = {
    name: z.string().min(1),
    available: z.boolean(),
    position: z.number().int(),
    printerId: z.string().cuid().nullish()
}

export const CreateCategorySchema = z.object({
    ...CategoryBase,
    printerId: CategoryBase.printerId.optional()
})

export const UpdateCategorySchema = z.object({
    ...CategoryBase,
    printerId: CategoryBase.printerId.optional()
})

export const PatchCategorySchema = z.object({
    available: z.boolean().optional(),
    printerId: CategoryBase.printerId.optional().nullable()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
})

export const UploadCategoryImageSchema = z.object({
    image: z.any()
})

export const GetCategoriesQuerySchema = z.object({
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    include: z.enum(['foods']).optional()
})

export const GetCategoryQuerySchema = z.object({
    include: z.enum(['foods'])
})

export const CategoryResponseSchema = z.object({
    id: z.string().cuid(),
    ...CategoryBase,
    image: z.string().url().nullish(),
    foods: z.array(FoodResponseSchema).optional()
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
export type PatchCategoryInput = z.infer<typeof PatchCategorySchema>
export type UploadCategoryImageInput = z.infer<typeof UploadCategoryImageSchema>
export type GetCategoriesQuery = z.infer<typeof GetCategoriesQuerySchema>
export type GetCategoryQuery = z.infer<typeof GetCategoryQuerySchema>
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>