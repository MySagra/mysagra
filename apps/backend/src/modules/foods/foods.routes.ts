import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { FoodsService } from "@/modules/foods/foods.service";
import {
    FoodResponseSchema,
    CreateFoodSchema,
    UpdateFoodSchema,
    PatchFoodSchema,
    GetFoodsQuerySchema,
    GetFoodQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new FoodsService();

export const foodsModule = createModule({
    basePath: "/v1/foods",
    tags: ["Foods"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all foods",
            description:
                "Returns all food items with optional filtering by availability, category and ingredient inclusion. " +
                "Non-admin users can only access foods with `available=true`.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            query: GetFoodsQuerySchema,
            responses: {
                200: { description: "List of food items", schema: z.array(FoodResponseSchema) },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getFoods(req.validated.query));
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get food item by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [],
            params: cuidParamSchema,
            query: GetFoodQuerySchema,
            responses: {
                200: { description: "Food item found", schema: FoodResponseSchema },
                404: { description: "Not Found - Food item not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getFoodById(req.validated.params.id, req.validated.query));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new food item",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"], ["ms_pt_"])],
            body: CreateFoodSchema,
            responses: {
                201: { description: "Food item created", schema: FoodResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                409: { description: "Conflict - Food name already exists" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createFood(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update food item by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: UpdateFoodSchema,
            responses: {
                200: { description: "Food item updated", schema: FoodResponseSchema },
                404: { description: "Not Found - Food item not found" },
                409: { description: "Conflict - Food name already exists" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updateFood(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Patch food availability or printer",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: PatchFoodSchema,
            responses: {
                200: { description: "Food item patched", schema: FoodResponseSchema },
                404: { description: "Not Found - Food item not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.patchFood(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete food item by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "Food item deleted" },
                404: { description: "Not Found - Food item not found" },
            },
            handler: async (req, res) => {
                await service.deleteFood(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
