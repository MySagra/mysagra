import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { IngredientsService } from "@/modules/ingredients/ingredients.service";
import {
    IngredientResponseSchema,
    CreateIngredientSchema,
    UpdateIngredientSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new IngredientsService();

export const ingredientsModule = createModule({
    basePath: "/v1/ingredients",
    tags: ["Ingredients"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all ingredients",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            responses: {
                200: { description: "List of ingredients", schema: z.array(IngredientResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await service.getIngredients());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get ingredient by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Ingredient found", schema: IngredientResponseSchema },
                404: { description: "Not Found - Ingredient not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getIngredientById(req.validated.params.id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new ingredient",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            body: CreateIngredientSchema,
            responses: {
                201: { description: "Ingredient created", schema: IngredientResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                409: { description: "Conflict - Ingredient name already exists" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createIngredient(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update ingredient by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: UpdateIngredientSchema,
            responses: {
                200: { description: "Ingredient updated", schema: IngredientResponseSchema },
                404: { description: "Not Found - Ingredient not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updateIngredient(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete ingredient by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "Ingredient deleted" },
                404: { description: "Not Found - Ingredient not found" },
            },
            handler: async (req, res) => {
                await service.deleteIngredient(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
