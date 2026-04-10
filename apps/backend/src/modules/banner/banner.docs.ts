import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    BannerInputSchema,
    BannerResponseSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const BannerResponse = registry.register("BannerResponse", BannerResponseSchema);
const BannerRequest = registry.register("BannerRequest", BannerInputSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/banners",
    summary: "Get all banners",
    description:
        "Returns all banners. " +
        "Accessible by admin, maintainer, and operator roles, as well as via WEBAPP API key (`ms_wb_`).",
    tags: ["Banners"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    responses: {
        200: {
            description: "List of banners",
            content: {
                "application/json": {
                    schema: z.array(BannerResponse),
                },
            },
        },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/banners/{id}",
    summary: "Get banner by ID",
    tags: ["Banners"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: {
        params: CUIDParam,
    },
    responses: {
        200: {
            description: "Banner found",
            content: {
                "application/json": { schema: BannerResponse },
            },
        },
        404: { description: "Not Found - Banner not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/banners",
    summary: "Create a new banner",
    tags: ["Banners"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: BannerRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Banner created",
            content: {
                "application/json": { schema: BannerResponse },
            },
        },
        400: { description: "Bad Request - Invalid input or validation error" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/banners/{id}",
    summary: "Update banner by ID",
    tags: ["Banners"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: BannerRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Banner updated",
            content: {
                "application/json": { schema: BannerResponse },
            },
        },
        404: { description: "Not Found - Banner not found" },
        400: { description: "Bad Request - Invalid input or validation error" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/banners/{id}/image",
    summary: "Upload banner image",
    tags: ["Banners"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "multipart/form-data": {
                    schema: z.object({
                        image: z.string().meta({ description: "Image file (binary)", format: "binary" }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Image uploaded",
            content: {
                "application/json": { schema: BannerResponse },
            },
        },
        400: { description: "Bad Request - No file provided for upload" },
        404: { description: "Not Found - Banner not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/banners/{id}",
    summary: "Delete banner by ID",
    tags: ["Banners"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "Banner deleted",
            content: {
                "application/json": { schema: BannerResponse },
            },
        },
        404: { description: "Not Found - Banner not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});
