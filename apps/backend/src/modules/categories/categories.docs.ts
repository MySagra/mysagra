import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    CategoryResponseSchema,
    CreateCategorySchema,
    UpdateCategorySchema,
    PatchCategorySchema,
    GetCategoriesQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const CategoryResponse = registry.register("CategoryResponse", CategoryResponseSchema);
const CreateCategoryRequest = registry.register("CreateCategoryRequest", CreateCategorySchema);
const UpdateCategoryRequest = registry.register("UpdateCategoryRequest", UpdateCategorySchema);
const PatchCategoryRequest = registry.register("PatchCategoryRequest", PatchCategorySchema);
const GetCategoriesQuery = registry.register("GetCategoriesQuery", GetCategoriesQuerySchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/categories",
    summary: "Get all categories",
    description:
        "Returns all categories with optional filtering by availability and optional inclusion of foods. " +
        "If `available=true` is specified the endpoint is public; otherwise admin authentication is required.",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }, {}],
    request: { query: GetCategoriesQuery },
    responses: {
        200: {
            description: "List of categories",
            content: {
                "application/json": {
                    schema: z.array(CategoryResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/categories/{id}",
    summary: "Get category by ID",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        params: CUIDParam,
        query: GetCategoriesQuery,
    },
    responses: {
        200: {
            description: "Category found",
            content: {
                "application/json": { schema: CategoryResponse },
            },
        },
        404: { description: "Category not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/categories",
    summary: "Create a new category",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateCategoryRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Category created",
            content: {
                "application/json": { schema: CategoryResponse },
            },
        },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/categories/{id}",
    summary: "Update category by ID",
    description:
        "Updates a category. Changing `available` also updates all associated foods' availability. " +
        "Changing `printerId` (or setting it to null) propagates to all associated foods.",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: UpdateCategoryRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Category updated",
            content: {
                "application/json": { schema: CategoryResponse },
            },
        },
        404: { description: "Category not found" },
        409: { description: "Conflict" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/categories/{id}",
    summary: "Partially update a category",
    description:
        "Partially updates a category. Changing `available` or `printerId` propagates to all associated foods.",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: PatchCategoryRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Category patched",
            content: {
                "application/json": { schema: CategoryResponse },
            },
        },
        404: { description: "Category not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/categories/{id}/image",
    summary: "Upload category image",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: z.object({
                        image: z.any().meta({ description: "Image file (binary)", format: "binary" }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Image uploaded",
            content: {
                "application/json": { schema: CategoryResponse },
            },
        },
        400: { description: "Invalid image file" },
        404: { description: "Category not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/categories/{id}",
    summary: "Delete category by ID",
    tags: ["Categories"],
    security: [{ bearerAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        204: { description: "Category deleted" },
        404: { description: "Category not found" },
        401: { description: "Unauthorized" },
    },
});
