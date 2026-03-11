import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    IngredientResponseSchema,
    CreateIngredientSchema,
    UpdateIngredientSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const IngredientResponse = registry.register("IngredientResponse", IngredientResponseSchema);
const CreateIngredientRequest = registry.register("CreateIngredientRequest", CreateIngredientSchema);
const UpdateIngredientRequest = registry.register("UpdateIngredientRequest", UpdateIngredientSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/ingredients",
    summary: "Get all ingredients",
    tags: ["Ingredients"],
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "List of ingredients",
            content: {
                "application/json": {
                    schema: z.array(IngredientResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/ingredients/{id}",
    summary: "Get ingredient by ID",
    tags: ["Ingredients"],
    security: [{ bearerAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "Ingredient found",
            content: {
                "application/json": { schema: IngredientResponse },
            },
        },
        404: { description: "Ingredient not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/ingredients",
    summary: "Create a new ingredient",
    tags: ["Ingredients"],
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateIngredientRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Ingredient created",
            content: {
                "application/json": { schema: IngredientResponse },
            },
        },
        400: { description: "Invalid input" },
        409: { description: "Ingredient name already exists" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/ingredients/{id}",
    summary: "Update ingredient by ID",
    tags: ["Ingredients"],
    security: [{ bearerAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: UpdateIngredientRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Ingredient updated",
            content: {
                "application/json": { schema: IngredientResponse },
            },
        },
        404: { description: "Ingredient not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/ingredients/{id}",
    summary: "Delete ingredient by ID",
    tags: ["Ingredients"],
    security: [{ bearerAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        204: { description: "Ingredient deleted" },
        404: { description: "Ingredient not found" },
        401: { description: "Unauthorized" },
    },
});
