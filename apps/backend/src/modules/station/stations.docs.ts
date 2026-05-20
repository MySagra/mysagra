import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    StationResponseSchema,
    StationInputSchema,
    GetStationQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const StationResponse = registry.register("StationResponse", StationResponseSchema);
const CreateStationRequest = registry.register("CreateStationRequest", StationInputSchema);
const UpdateStationRequest = registry.register("UpdateStationRequest", StationInputSchema);
const GetStationQuery = registry.register("GetStationQuery", GetStationQuerySchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/stations",
    summary: "Get all stations",
    description:
        "Returns all stations with optional inclusion of categories. " +
        "Query parameters: `include` (categories, categories.foods, categories.foods.ingredients). " +
        "'categories.foods' and 'categories.foods.ingredients' include both levels.",
    tags: ["Stations"],
    security: [{ cookieAuth: [] }],
    request: { query: GetStationQuery },
    responses: {
        200: {
            description: "List of stations",
            content: {
                "application/json": {
                    schema: z.array(StationResponse),
                },
            },
        },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/stations/{id}",
    summary: "Get station by ID",
    description:
        "Returns a single station with optional inclusion of categories and related foods.",
    tags: ["Stations"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        query: GetStationQuery,
    },
    responses: {
        200: {
            description: "Station found",
            content: {
                "application/json": { schema: StationResponse },
            },
        },
        404: { description: "Not Found - Station not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/stations",
    summary: "Create a new station",
    tags: ["Stations"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateStationRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Station created",
            content: {
                "application/json": { schema: StationResponse },
            },
        },
        400: { description: "Bad Request - Invalid input or validation error" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/stations/{id}",
    summary: "Update station by ID",
    tags: ["Stations"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: UpdateStationRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Station updated",
            content: {
                "application/json": { schema: StationResponse },
            },
        },
        404: { description: "Not Found - Station not found" },
        409: { description: "Conflict - Duplicate station name or constraint violation" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/stations/{id}",
    summary: "Delete station by ID",
    tags: ["Stations"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        204: { description: "Station deleted" },
        404: { description: "Not Found - Station not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});
