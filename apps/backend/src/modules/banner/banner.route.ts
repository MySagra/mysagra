import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { BadRequestError } from "@/common/errors";
import { BannerService } from "./banner.service";
import { BannerInputSchema, BannerResponseSchema, cuidParamSchema } from "@mysagra/schemas";

const service = new BannerService();

export const bannerModule = createModule({
    basePath: "/v1/banners",
    tags: ["Banners"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all banners",
            description:
                "Returns all banners. " +
                "Accessible by admin, maintainer, and operator roles, as well as via WEBAPP API key (`ms_wb_`).",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_"])],
            responses: {
                200: { description: "List of banners", schema: z.array(BannerResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await service.getBanners());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get banner by ID",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Banner found", schema: BannerResponseSchema },
                404: { description: "Not Found - Banner not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getBanner(req.validated.params.id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new banner",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            body: BannerInputSchema,
            responses: {
                201: { description: "Banner created", schema: BannerResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createBanner(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update banner by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: BannerInputSchema,
            responses: {
                201: { description: "Banner updated", schema: BannerResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - Banner not found" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.updateBanner(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}/image",
            summary: "Upload banner image",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"]), ...BannerService.imageService.upload()],
            params: cuidParamSchema,
            responses: {
                200: { description: "Image uploaded", schema: BannerResponseSchema },
                400: { description: "Bad Request - No file provided for upload" },
                404: { description: "Not Found - Banner not found" },
            },
            handler: async (req, res) => {
                if (!req.file) throw new BadRequestError("No file provided for upload");
                res.status(200).json(await service.uploadImage(req.validated.params.id, req.file));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete banner by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Banner deleted", schema: BannerResponseSchema },
                404: { description: "Not Found - Banner not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.deleteBanner(req.validated.params.id));
            },
        }),
    ],
});
