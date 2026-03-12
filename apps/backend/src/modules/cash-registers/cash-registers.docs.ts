import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    CashRegisterResponseSchema,
    CreateCashRegisterSchema,
    UpdateCashRegisterSchema,
    PatchCashRegisterSchema,
    GetCashRegisterQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const CashRegisterResponse = registry.register("CashRegisterResponse", CashRegisterResponseSchema);
const CreateCashRegisterRequest = registry.register("CreateCashRegisterRequest", CreateCashRegisterSchema);
const UpdateCashRegisterRequest = registry.register("UpdateCashRegisterRequest", UpdateCashRegisterSchema);
const PatchCashRegisterRequest = registry.register("PatchCashRegisterRequest", PatchCashRegisterSchema);
const GetCashRegisterQuery = registry.register("GetCashRegisterQuery", GetCashRegisterQuerySchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/cash-registers",
    summary: "Get all cash registers",
    tags: ["CashRegisters"],
    security: [{ cookieAuth: [] }],
    request: { query: GetCashRegisterQuery },
    responses: {
        200: {
            description: "List of cash registers",
            content: {
                "application/json": {
                    schema: z.array(CashRegisterResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/cash-registers/{id}",
    summary: "Get cash register by ID",
    tags: ["CashRegisters"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        query: GetCashRegisterQuery,
    },
    responses: {
        200: {
            description: "Cash register found",
            content: {
                "application/json": {
                    schema: CashRegisterResponse,
                },
            },
        },
        404: { description: "Cash register not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/cash-registers",
    summary: "Create a new cash register",
    tags: ["CashRegisters"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateCashRegisterRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Cash register created",
            content: {
                "application/json": { schema: CashRegisterResponse },
            },
        },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/cash-registers/{id}",
    summary: "Update cash register by ID",
    tags: ["CashRegisters"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: UpdateCashRegisterRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Cash register updated",
            content: {
                "application/json": { schema: CashRegisterResponse },
            },
        },
        404: { description: "Cash register not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/cash-registers/{id}",
    summary: "Patch cash register enabled status",
    tags: ["CashRegisters"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: PatchCashRegisterRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Cash register status updated",
            content: {
                "application/json": { schema: CashRegisterResponse },
            },
        },
        404: { description: "Cash register not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/cash-registers/{id}",
    summary: "Delete cash register by ID",
    tags: ["CashRegisters"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: { description: "Cash register deleted" },
        404: { description: "Cash register not found" },
        401: { description: "Unauthorized" },
    },
});
