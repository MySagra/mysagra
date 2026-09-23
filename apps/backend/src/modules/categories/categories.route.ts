import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { ForbiddenError, BadRequestError } from "@/common/errors";
import { CategoriesService } from "@/modules/categories/categories.service";
import {
    CategoryResponseSchema,
    CreateCategorySchema,
    UpdateCategorySchema,
    PatchCategorySchema,
    GetCategoriesQuerySchema,
    GetCategoryQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new CategoriesService();

export const categoriesModule = createModule({
    basePath: "/v1/categories",
    tags: ["Categories"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all categories",
            description:
                "Returns all categories with optional filtering by availability and optional inclusion of foods. " +
                "Query parameters: `available` (true/false), `include` (foods, foods.ingredients), `foodsAvailable` (true/false/all). " +
                "If `available=true` is specified the endpoint is public; otherwise admin authentication is required. " +
                "Also accessible via WEBAPP API key (`ms_wb_`).",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }, {}],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_"])],
            query: GetCategoriesQuerySchema,
            responses: {
                200: { description: "List of categories", schema: z.array(CategoryResponseSchema) },
                403: { description: "Forbidden - API key can only access available categories with available foods" },
            },
            handler: async (req, res) => {
                const { available, foodsAvailable } = req.validated.query;
                if (req.apiKey && !req.user && (available !== true || foodsAvailable !== true)) {
                    throw new ForbiddenError("API key can only access available categories with available foods");
                }
                res.status(200).json(await service.getCategories(req.validated.query));
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get category by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            query: GetCategoryQuerySchema,
            responses: {
                200: { description: "Category found", schema: CategoryResponseSchema },
                404: { description: "Not Found - Category not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getCategoryById(req.validated.params.id, req.validated.query));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new category",
            description:
                "Creates a new category. Can optionally associate with a station via `stationId` and a printer via `printerId`.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: CreateCategorySchema,
            responses: {
                201: { description: "Category created", schema: CategoryResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createCategory(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update category by ID",
            description:
                "Updates a category. Changing `available` also updates all associated foods' availability. " +
                "Changing `printerId` (or setting it to null) propagates to all associated foods. " +
                "Can update station association via `stationId`.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: UpdateCategorySchema,
            responses: {
                200: { description: "Category updated", schema: CategoryResponseSchema },
                404: { description: "Not Found - Category not found" },
                409: { description: "Conflict - Duplicate category name or constraint violation" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updateCategory(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Partially update a category",
            description:
                "Partially updates a category. Changing `available` or `printerId` propagates to all associated foods. " +
                "Can update station association via `stationId`.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: PatchCategorySchema,
            responses: {
                200: { description: "Category patched", schema: CategoryResponseSchema },
                404: { description: "Not Found - Category not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.patchCategory(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}/image",
            summary: "Upload category image",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"]), ...CategoriesService.imageService.upload()],
            params: cuidParamSchema,
            responses: {
                200: { description: "Image uploaded", schema: CategoryResponseSchema },
                400: { description: "Bad Request - No file provided for upload" },
                404: { description: "Not Found - Category not found" },
            },
            handler: async (req, res) => {
                if (!req.file) throw new BadRequestError("No file provided for upload");
                res.status(200).json(await service.uploadImage(req.validated.params.id, req.file));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete category by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "Category deleted" },
                404: { description: "Not Found - Category not found" },
            },
            handler: async (req, res) => {
                await service.deleteCategory(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
