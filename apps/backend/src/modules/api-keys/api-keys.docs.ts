import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    ApiKeyBaseResponseSchema,
    CreateApiKeySchema,
    CreateApiKeyResponseSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const ApiKeyResponse = registry.register("ApiKeyResponse", ApiKeyBaseResponseSchema);
const CreateApiKeyRequest = registry.register("CreateApiKeyRequest", CreateApiKeySchema);
const CreateApiKeyResponse = registry.register("CreateApiKeyResponse", CreateApiKeyResponseSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/api-keys",
    summary: "Get all API keys",
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "List of API keys",
            content: {
                "application/json": {
                    schema: z.array(ApiKeyResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/api-keys/{id}",
    summary: "Get API key by ID",
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "API key found",
            content: {
                "application/json": { schema: ApiKeyResponse },
            },
        },
        404: { description: "API key not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/api-keys",
    summary: "Create a new API key",
    description: "Creates a new API key. The `type` field determines the key prefix and its intended use:\n- `PRINTER` — used by printer clients (prefix: `ms_pt_`)\n- `WEBAPP` — used by web application clients (prefix: `ms_wb_`)\n\nThe full API key is returned **only once** at creation time.",
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateApiKeyRequest },
            },
        },
    },
    responses: {
        201: {
            description: "API key created",
            content: {
                "application/json": { schema: CreateApiKeyResponse },
            },
        },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/api-keys/{id}",
    summary: "Revoke API key by ID",
    tags: ["API Keys"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        204: { description: "API key revoked" },
        404: { description: "API key not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});
