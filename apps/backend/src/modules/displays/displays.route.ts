import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { displaysService } from "./displays.service";
import {
    DisplayResponseSchema,
    DisplayWithStationsResponseSchema,
    CreateDisplaySchema,
    UpdateDisplaySchema,
    PatchDisplaySchema,
    GetDisplayQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

export const displaysModule = createModule({
    basePath: "/v1/displays",
    tags: ["Displays"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all displays",
            description:
                "Returns all the public displays with their settings (view, alert, auto scroll) and the ids of their stations. " +
                "Query parameters: `include` (stations) to also return the full stations.",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_", "ms_ds_"])],
            query: GetDisplayQuerySchema,
            responses: {
                200: { description: "List of displays", schema: z.array(DisplayWithStationsResponseSchema) },
            },
            handler: async (req, res) => {
                res.status(200).json(await displaysService.getDisplays(req.validated.query));
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get display by ID",
            description: "Returns a single display with its settings, with optional inclusion of the full stations.",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_", "ms_ds_"])],
            params: cuidParamSchema,
            query: GetDisplayQuerySchema,
            responses: {
                200: { description: "Display found", schema: DisplayWithStationsResponseSchema },
                404: { description: "Not Found - Display not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await displaysService.getDisplayById(req.validated.params.id, req.validated.query));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new display",
            description: "Creates a display. `view`, `showAlert` and `autoScroll` default to READY, true and true.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: CreateDisplaySchema,
            responses: {
                201: { description: "Display created", schema: DisplayResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - One of the stations not found" },
                409: { description: "Conflict - A display with this name already exists" },
            },
            handler: async (req, res) => {
                res.status(201).json(await displaysService.createDisplay(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update display by ID",
            description: "Replaces the display's name, description, settings and stations.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: UpdateDisplaySchema,
            responses: {
                200: { description: "Display updated", schema: DisplayResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - Display or one of the stations not found" },
                409: { description: "Conflict - A display with this name already exists" },
            },
            handler: async (req, res) => {
                res.status(200).json(await displaysService.updateDisplay(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Update display settings",
            description: "Partially updates the display's settings (view, showAlert, autoScroll) and stations.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: PatchDisplaySchema,
            responses: {
                200: { description: "Display settings updated", schema: DisplayResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - Display or one of the stations not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await displaysService.patchDisplay(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete display by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "Display deleted" },
                404: { description: "Not Found - Display not found" },
            },
            handler: async (req, res) => {
                await displaysService.deleteDisplay(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
