import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { NotFoundError } from "@/common/errors";
import { reportService } from "./report.service";
import {
    GetReportsQuerySchema,
    ReportSchema,
    cuidParamSchema,
    GeneralClosureInputSchema,
} from "@mysagra/schemas";

export const reportModule = createModule({
    basePath: "/v1/reports",
    tags: ["Reports"],
    limiter: apiLimiter,
    commonResponses: {
        ...AUTH_RESPONSES,
        403: { description: "Forbidden - Insufficient permissions (requires admin or maintainer)" },
    },
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get reports with optional grouping",
            description:
                "Retrieves reports for a specified time range with optional interval-based grouping. " +
                "Reports contain detailed statistics including order metrics, category breakdown, and per-food stats. " +
                "Requires admin or maintainer role.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            query: GetReportsQuerySchema,
            responses: {
                200: { description: "List of reports grouped by specified interval", schema: z.array(ReportSchema) },
                400: { description: "Bad Request - Invalid input or validation error" },
            },
            handler: async (req, res) => {
                res.status(200).json(await reportService.getReports(req.validated.query));
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get report by ID",
            description:
                "Retrieves a specific report by its ID. Includes full details of the report including order metrics, " +
                "category statistics, and per-food breakdown. Requires admin or maintainer role.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            query: GetReportsQuerySchema,
            responses: {
                200: { description: "Report found", schema: ReportSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - Report not found" },
            },
            handler: async (req, res) => {
                const report = await reportService.getReport(req.validated.params.id);
                if (!report) throw new NotFoundError("Report not found");
                res.status(200).json(report);
            },
        }),
        route({
            method: "post",
            path: "/general-closure",
            summary: "Generate daily closure report",
            description:
                "Generates and broadcasts a daily closure report from 7:00 AM to current time. " +
                "Report includes all order metrics, category and food statistics, and cash register breakdown. " +
                "Automatically broadcasts to printer channel for receipt printing. Requires admin or maintainer role.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            body: GeneralClosureInputSchema,
            responses: {
                201: { description: "Closure report generated and broadcasted to printers", schema: z.array(ReportSchema) },
            },
            handler: async (req, res) => {
                res.status(201).json(await reportService.generalClosure(req.validated.body));
            },
        }),
    ],
});
