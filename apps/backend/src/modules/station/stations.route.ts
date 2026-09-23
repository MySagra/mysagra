import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { NotFoundError } from "@/common/errors";
import { StationsService } from "./stations.service";
import {
    StationResponseSchema,
    StationInputSchema,
    GetStationQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new StationsService();

export const stationsModule = createModule({
    basePath: "/v1/stations",
    tags: ["Stations"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all stations",
            description:
                "Returns all stations with optional inclusion of categories. " +
                "Query parameters: `include` (categories, categories.foods, categories.foods.ingredients). " +
                "'categories.foods' and 'categories.foods.ingredients' include both levels.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            query: GetStationQuerySchema,
            responses: {
                200: { description: "List of stations", schema: z.array(StationResponseSchema) },
            },
            handler: async (req, res) => {
                const stations = await service.getStations(req.validated.query);
                if (!stations) throw new NotFoundError("No stations found");
                res.status(200).json(stations);
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get station by ID",
            description: "Returns a single station with optional inclusion of categories and related foods.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            params: cuidParamSchema,
            query: GetStationQuerySchema,
            responses: {
                200: { description: "Station found", schema: StationResponseSchema },
                404: { description: "Not Found - Station not found" },
            },
            handler: async (req, res) => {
                const station = await service.getStationById(req.validated.params.id, req.validated.query);
                if (!station) throw new NotFoundError("Station not found");
                res.status(200).json(station);
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new station",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: StationInputSchema,
            responses: {
                201: { description: "Station created", schema: StationResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createStation(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update station by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: StationInputSchema,
            responses: {
                200: { description: "Station updated", schema: StationResponseSchema },
                404: { description: "Not Found - Station not found" },
                409: { description: "Conflict - Duplicate station name or constraint violation" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updateStation(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete station by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "Station deleted" },
                404: { description: "Not Found - Station not found" },
            },
            handler: async (req, res) => {
                await service.deleteStation(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
