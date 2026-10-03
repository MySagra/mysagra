import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { settingService } from "@/modules/settings/settings.service";
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
    ],
});
