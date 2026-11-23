import { createModule, route, type RouteDefinition } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { env } from "@/config/env";
import { EventsService } from "@/modules/events/events.service";
import { eventSchema } from "@mysagra/schemas";
import { ForbiddenError } from "@/common/errors";

const routes: RouteDefinition[] = [
    route({
        method: "get",
        path: "/{channel}",
        summary: "Subscribe to Server-Sent Events (SSE)",
        description:
            "Establishes a persistent SSE connection to receive real-time updates for the specified channel " +
            "(`cashier`, `display`, `printer`, `ticket`). Keep-alive comments are sent every 15 seconds; data messages are " +
            "delivered as `data: {JSON}\\n\\n`. The PRINTER API key (`ms_pt_`) can only subscribe to the `printer` channel, " +
            "the DISPLAY API key (`ms_ds_`) only to the `display` channel.",
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_", "ms_ds_"])],
        params: eventSchema,
        responses: {
            200: { description: "SSE stream established. Connection stays open until the client disconnects." },
            400: { description: "Invalid channel parameter" },
            401: { description: "Unauthorized" },
            403: { description: "Forbidden — operators and administrators only" },
        },
        handler: (req, res) => {
            const { channel } = req.validated.params;

            if (req.apiKey?.prefix === "ms_pt_" && channel !== "printer") {
                throw new ForbiddenError("PRINTER API key can only subscribe to the printer channel");
            }

            if (req.apiKey?.prefix === "ms_ds_" && channel !== "display") {
                throw new ForbiddenError("DISPLAY API key can only subscribe to the display channel");
            }

            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();

            const event = EventsService.getInstance(channel);
            event.addClient(res, req);

            // Heartbeat
            res.write(`id: ${Date.now()}\n: keepalive\n\n`);
            const keepAliveInterval = setInterval(
                () => res.write(`id: ${Date.now()}\n: keepalive\n\n`),
                15000,
            );

            req.on("close", () => {
                clearInterval(keepAliveInterval);
                event.removeClient(res);
            });
        },
    }),
];

if (env.NODE_ENV !== "production") {
    routes.push(
        route({
            method: "get",
            path: "/debug/destroy-connections/{channel}",
            summary: "[DEBUG] Destroy all SSE connections for a channel",
            description:
                "Forces all active SSE clients on the specified channel to disconnect. " +
                "Available in non-production environments only.",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: eventSchema,
            responses: {
                200: { description: "Connections destroyed. Returns count of disconnected clients." },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — admin only" },
            },
            handler: (req, res) => {
                const { channel } = req.validated.params;
                const event = EventsService.getInstance(channel);
                res.status(200).json({ connections: event.destroyConnections() });
            },
        }),
    );
}

export const eventsModule = createModule({
    basePath: "/events",
    tags: ["Events (SSE)"],
    limiter: apiLimiter,
    routes,
});
