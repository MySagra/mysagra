import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { ApiKeysService } from "./api-keys.service";
import {
    ApiKeyBaseResponseSchema,
    CreateApiKeySchema,
    CreateApiKeyResponseSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new ApiKeysService();

export const apiKeysModule = createModule({
    basePath: "/v1/api-keys",
    tags: ["API Keys"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all API keys",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            responses: {
                200: { description: "List of API keys", schema: z.array(ApiKeyBaseResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await service.getAPIKeys());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get API key by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "API key found", schema: ApiKeyBaseResponseSchema },
                404: { description: "API key not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getAPIKey(req.validated.params.id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new API key",
            description:
                "Creates a new API key. The `type` field determines the key prefix and its intended use:\n- `PRINTER` — used by printer clients (prefix: `ms_pt_`)\n- `WEBAPP` — used by web application clients (prefix: `ms_wb_`)\n\nThe full API key is returned **only once** at creation time.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: CreateApiKeySchema,
            responses: {
                201: { description: "API key created", schema: CreateApiKeyResponseSchema },
                400: { description: "Invalid input" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createApiKey(req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Revoke API key by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "API key revoked" },
                404: { description: "API key not found" },
            },
            handler: async (req, res) => {
                await service.revokeApiKey(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
