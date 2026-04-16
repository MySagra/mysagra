import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    GetReportsQuerySchema,
    ReportSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const GetReportsQuery = registry.register("GetReportsQuery", GetReportsQuerySchema);
const ReportResponse = registry.register("ReportResponse", ReportSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/reports",
    summary: "Get reports with optional grouping",
    description:
        "Retrieves reports for a specified time range with optional interval-based grouping. " +
        "Reports contain detailed statistics including order metrics, category breakdown, and per-food stats. " +
        "Requires admin or maintainer role.",
    tags: ["Reports"],
    security: [{ cookieAuth: [] }],
    request: { query: GetReportsQuery },
    responses: {
        200: {
            description: "List of reports grouped by specified interval",
            content: {
                "application/json": {
                    schema: z.array(ReportResponse),
                },
            },
        },
        400: { description: "Bad Request - Invalid input or validation error" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions (requires admin or maintainer)" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/reports/{id}",
    summary: "Get report by ID",
    description:
        "Retrieves a specific report by its ID. Includes full details of the report including order metrics, " +
        "category statistics, and per-food breakdown. Requires admin or maintainer role.",
    tags: ["Reports"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam
    },
    responses: {
        200: {
            description: "Report found",
            content: {
                "application/json": { schema: ReportResponse },
            },
        },
        400: { description: "Bad Request - Invalid input or validation error" },
        404: { description: "Not Found - Report not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions (requires admin or maintainer)" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});
