import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { SettingService, settingService } from "@/modules/settings/settings.service";
import { BadRequestError } from "@/common/errors";
import { SettingsResponseSchema, UpdateSettingsSchema } from "@mysagra/schemas";

export const settingsModule = createModule({
    basePath: "/v1/settings",
    tags: ["Settings"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get the sagra settings",
            description:
                "Returns the sagra name and its settings, with the defaults applied to any missing field. " +
                "Accessible by every role and by the WEBAPP (`ms_wb_`) and PRINTER (`ms_pt_`) API keys, " +
                "since the clients apply these rules (e.g. customer and table fields at the cash desk).",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_", "ms_pt_"])],
            responses: {
                200: { description: "Current settings", schema: SettingsResponseSchema },
                404: { description: "Not Found - The sagra is not configured yet" },
            },
            handler: async (_req, res) => {
                res.status(200).json(await settingService.getSettings());
            },
        }),
        route({
            method: "put",
            path: "",
            summary: "Replace the sagra settings",
            description:
                "Replaces the whole settings document and updates the sagra name. " +
                "Fields missing from `settings` are reset to their defaults. Admin only.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: UpdateSettingsSchema,
            responses: {
                200: { description: "Settings saved", schema: SettingsResponseSchema },
                400: { description: "Bad request - missing or invalid fields" },
                404: { description: "Not Found - The sagra is not configured yet" },
            },
            handler: async (req, res) => {
                res.status(200).json(await settingService.updateSettings(req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/logo",
            summary: "Upload the receipt logo",
            description:
                "Uploads the black and white logo printed on receipts (`multipart/form-data`, field `image`, max 5MB). " +
                "Replaces the previous logo, which is deleted. Admin only.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"]), ...SettingService.imageService.upload()],
            responses: {
                200: { description: "Logo uploaded, returns the updated settings", schema: SettingsResponseSchema },
                400: { description: "Bad request - no file provided, or not a supported image" },
                404: { description: "Not Found - The sagra is not configured yet" },
            },
            handler: async (req, res) => {
                if (!req.file) throw new BadRequestError("No file provided for upload");
                res.status(200).json(await settingService.updateReceiptLogo(req.file));
            },
        }),
        route({
            method: "delete",
            path: "/logo",
            summary: "Remove the receipt logo",
            description: "Deletes the receipt logo: receipts are printed without it. Admin only.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            responses: {
                200: { description: "Logo removed, returns the updated settings", schema: SettingsResponseSchema },
                404: { description: "Not Found - The sagra is not configured yet" },
            },
            handler: async (_req, res) => {
                res.status(200).json(await settingService.deleteReceiptLogo());
            },
        }),
    ],
});
