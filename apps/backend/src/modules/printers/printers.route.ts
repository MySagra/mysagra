import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { PrintersService } from "@/modules/printers/printers.service";
import {
    PrinterResponseSchema,
    CreatePrinterSchema,
    UpdatePrinterSchema,
    PatchPrinterSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new PrintersService();

export const printersModule = createModule({
    basePath: "/v1/printers",
    tags: ["Printers"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all printers",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            responses: {
                200: { description: "List of printers", schema: z.array(PrinterResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await service.getPrinters());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get printer by ID",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Printer found", schema: PrinterResponseSchema },
                404: { description: "Not Found - Printer not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getPrinterById(req.validated.params.id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new printer",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: CreatePrinterSchema,
            responses: {
                201: { description: "Printer created", schema: PrinterResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createPrinter(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update printer by ID",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin"], ["ms_pt_"])],
            params: cuidParamSchema,
            body: UpdatePrinterSchema,
            responses: {
                200: { description: "Printer updated", schema: PrinterResponseSchema },
                404: { description: "Not Found - Printer not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updatePrinter(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Update printer status",
            description: "Updates the operational status of a printer (ONLINE, OFFLINE, ERROR).",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"], ["ms_pt_"])],
            params: cuidParamSchema,
            body: PatchPrinterSchema,
            responses: {
                200: { description: "Printer status updated", schema: PrinterResponseSchema },
                404: { description: "Not Found - Printer not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.patchPrinter(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete printer by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Printer deleted" },
                404: { description: "Not Found - Printer not found" },
            },
            handler: async (req, res) => {
                await service.deletePrinter(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
