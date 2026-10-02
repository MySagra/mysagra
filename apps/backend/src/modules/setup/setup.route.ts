import { createModule, route } from "@/core/http";
import { authLimiter } from "@/middlewares/rateLimiter.middleware";
import { setupService } from "@/modules/setup/setup.service";
import { CreateSetupSchema, SetupResponseSchema, SetupStatusResponseSchema } from "@mysagra/schemas";

export const setupModule = createModule({
    basePath: "/v1/setup",
    tags: ["Setup"],
    // counts only failed attempts: limits guessing the setup token
    limiter: authLimiter,
    routes: [
        route({
            method: "get",
            path: "/status",
            summary: "Get initial setup status",
            description:
                "Public endpoint. Tells the frontend whether the initial setup wizard must be shown " +
                "(no users exist yet).",
            responses: {
                200: { description: "Setup status", schema: SetupStatusResponseSchema },
            },
            handler: async (_req, res) => {
                res.status(200).json({ required: !setupService.getStatus() });
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Run the initial setup",
            description:
                "Public endpoint, usable only once. Creates the sagra, its settings and the first admin user. " +
                "Requires the setup token printed in the backend logs at startup (or the SETUP_TOKEN env variable). " +
                "After a successful setup the admin logs in with the chosen credentials.",
            body: CreateSetupSchema,
            responses: {
                201: { description: "Setup completed", schema: SetupResponseSchema },
                400: { description: "Bad request — missing or invalid fields" },
                401: { description: "Unauthorized — invalid setup token" },
                409: { description: "Conflict — the instance is already set up" },
                429: { description: "Too Many Requests — too many failed attempts" },
            },
            handler: async (req, res) => {
                res.status(201).json(await setupService.createSetup(req.validated.body));
            },
        }),
    ],
});
