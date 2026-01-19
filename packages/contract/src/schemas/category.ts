import z from "zod"

import { FoodResponseSchema } from "./food";
import { registry } from "../registry";

const CategoryBaseSchema = z.object({
    name: z.string().min(1).max(100).describe("Name of the category"),
    available: z.boolean().describe("Whether the category is available for ordering"),
    position: z.number().int().describe("Display position in the menu"),
    printerId: z.cuid().nullish().describe("ID of the printer assigned to this category")
})

export const CreateCategoryRequestSchema = z.object({
    ...CategoryBaseSchema.shape,
    printerId: CategoryBaseSchema.shape.printerId.optional()
}).openapi("CreateCategoryRequest", {
    description: "Request body for creating a new category",
    example: {
        name: "Beverages",
        available: true,
        position: 1,
        printerId: "clh1234567890abcdef"
    }
})

export const UpdateCategoryRequestSchema = z.object({
    ...CategoryBaseSchema.shape,
    printerId: CategoryBaseSchema.shape.printerId.optional()
}).openapi("UpdateCategoryRequest", {
    description: "Request body for updating a category",
    example: {
        name: "Hot Beverages",
        available: true,
        position: 2,
        printerId: "clh1234567890abcdef"
    }
})

export const PatchCategoryRequestSchema = z.object({
    available: z.boolean().optional().describe("Whether the category is available"),
    printerId: CategoryBaseSchema.shape.printerId.optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided"
}).openapi("PatchCategoryRequest", {
    description: "Request body for partially updating a category",
    example: {
        available: false
    }
})

export const UploadCategoryImageSchema = z.object({
    image: z.any().describe("Image file to upload")
})

export const GetCategoriesQuerySchema = z.object({
    available: z.enum(['true', 'false']).transform(val => val === 'true').optional().describe("Filter by availability"),
    include: z.enum(['foods']).optional().describe("Include related foods")
})

export const GetCategoryQuerySchema = z.object({
    include: z.enum(['foods']).describe("Include related foods")
})

export const CategoryResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the category"),
    ...CategoryBaseSchema.shape,
    image: z.string().url().nullish().describe("URL of the category image"),
    foods: z.array(FoodResponseSchema).optional().describe("List of foods in this category")
}).openapi("CategoryResponse", {
    description: "Category data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        name: "Beverages",
        available: true,
        position: 1,
        printerId: "clh0987654321fedcba",
        image: "https://example.com/images/beverages.jpg"
    }
})

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>
export type PatchCategoryRequest = z.infer<typeof PatchCategoryRequestSchema>
export type UploadCategoryImageInput = z.infer<typeof UploadCategoryImageSchema>
export type GetCategoriesQuery = z.infer<typeof GetCategoriesQuerySchema>
export type GetCategoryQuery = z.infer<typeof GetCategoryQuerySchema>
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>

registry.register("CreateCategoryRequest", CreateCategoryRequestSchema)
registry.register("UpdateCategoryRequest", UpdateCategoryRequestSchema)
registry.register("PatchCategoryRequest", PatchCategoryRequestSchema)
registry.register("CategoryResponse", CategoryResponseSchema)