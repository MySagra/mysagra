import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    FoodResponseSchema,
    CreateFoodSchema,
    UpdateFoodSchema,
    PatchFoodSchema,
    GetFoodsQuerySchema,
    GetFoodQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const FoodResponse = registry.register("FoodResponse", FoodResponseSchema);
const CreateFoodRequest = registry.register("CreateFoodRequest", CreateFoodSchema);
const UpdateFoodRequest = registry.register("UpdateFoodRequest", UpdateFoodSchema);
const PatchFoodRequest = registry.register("PatchFoodRequest", PatchFoodSchema);
const GetFoodsQuery = registry.register("GetFoodsQuery", GetFoodsQuerySchema);
const GetFoodQuery = registry.register("GetFoodQuery", GetFoodQuerySchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/foods",
    summary: "Get all foods",
    description:
        "Returns all food items with optional filtering by availability, category and ingredient inclusion. " +
        "Non-admin users can only access foods with `available=true`.",
    tags: ["Foods"],
    security: [{ cookieAuth: [] }],
    request: { query: GetFoodsQuery },
    responses: {
        200: {
            description: "List of food items",
            content: {
                "application/json": {
                    schema: z.array(FoodResponse),
                },
            },
        },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/foods/{id}",
    summary: "Get food item by ID",
    tags: ["Foods"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        query: GetFoodQuery,
    },
    responses: {
        200: {
            description: "Food item found",
            content: {
                "application/json": { schema: FoodResponse },
            },
        },
        404: { description: "Not Found - Food item not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/foods",
    summary: "Create a new food item",
    tags: ["Foods"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateFoodRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Food item created",
            content: {
                "application/json": { schema: FoodResponse },
            },
        },
        400: { description: "Bad Request - Invalid input or validation error" },
        409: { description: "Conflict - Food name already exists" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions (requires admin or maintainer)" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/foods/{id}",
    summary: "Update food item by ID",
    tags: ["Foods"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: UpdateFoodRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Food item updated",
            content: {
                "application/json": { schema: FoodResponse },
            },
        },
        404: { description: "Not Found - Food item not found" },
        409: { description: "Conflict - Food name already exists" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions (requires admin or maintainer)" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/foods/{id}",
    summary: "Patch food availability or printer",
    tags: ["Foods"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: PatchFoodRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Food item patched",
            content: {
                "application/json": { schema: FoodResponse },
            },
        },
        404: { description: "Not Found - Food item not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions (requires admin or maintainer)" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/foods/{id}",
    summary: "Delete food item by ID",
    tags: ["Foods"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        204: { description: "Food item deleted" },
        404: { description: "Not Found - Food item not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions (requires admin)" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});
