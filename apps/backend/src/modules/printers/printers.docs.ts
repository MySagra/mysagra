import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    PrinterResponseSchema,
    CreatePrinterSchema,
    UpdatePrinterSchema,
    PatchPrinterSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const PrinterResponse = registry.register("PrinterResponse", PrinterResponseSchema);
const CreatePrinterRequest = registry.register("CreatePrinterRequest", CreatePrinterSchema);
const UpdatePrinterRequest = registry.register("UpdatePrinterRequest", UpdatePrinterSchema);
const PatchPrinterRequest = registry.register("PatchPrinterRequest", PatchPrinterSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/printers",
    summary: "Get all printers",
    tags: ["Printers"],
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "List of printers",
            content: {
                "application/json": {
                    schema: z.array(PrinterResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/printers/{id}",
    summary: "Get printer by ID",
    tags: ["Printers"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "Printer found",
            content: {
                "application/json": { schema: PrinterResponse },
            },
        },
        404: { description: "Printer not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/printers",
    summary: "Create a new printer",
    tags: ["Printers"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreatePrinterRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Printer created",
            content: {
                "application/json": { schema: PrinterResponse },
            },
        },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/printers/{id}",
    summary: "Update printer by ID",
    tags: ["Printers"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: UpdatePrinterRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Printer updated",
            content: {
                "application/json": { schema: PrinterResponse },
            },
        },
        404: { description: "Printer not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/printers/{id}",
    summary: "Update printer status",
    description: "Updates the operational status of a printer (ONLINE, OFFLINE, ERROR).",
    tags: ["Printers"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: PatchPrinterRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Printer status updated",
            content: {
                "application/json": { schema: PrinterResponse },
            },
        },
        404: { description: "Printer not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/printers/{id}",
    summary: "Delete printer by ID",
    tags: ["Printers"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: { description: "Printer deleted" },
        404: { description: "Printer not found" },
        401: { description: "Unauthorized" },
    },
});
