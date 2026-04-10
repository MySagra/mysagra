import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    CreateOrderInstructionSchema,
    UpdateOrderInstructionSchema,
    OrderInstructionResponseSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const OrderInstructionResponse = registry.register(
    "OrderInstructionResponse",
    OrderInstructionResponseSchema
);
const OrderInstructionRequest = registry.register(
    "OrderInstructionRequest",
    CreateOrderInstructionSchema
);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/order-instructions",
    summary: "Get all order instructions",
    description:
        "Returns all order instructions. " +
        "Accessible by admin, maintainer, and operator roles, as well as via WEBAPP API key (`ms_wb_`).",
    tags: ["Order Instructions"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    responses: {
        200: {
            description: "List of order instructions",
            content: {
                "application/json": {
                    schema: z.array(OrderInstructionResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/order-instructions/{id}",
    summary: "Get order instruction by ID",
    tags: ["Order Instructions"],
    security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
    request: {
        params: CUIDParam,
    },
    responses: {
        200: {
            description: "Order instruction found",
            content: {
                "application/json": { schema: OrderInstructionResponse },
            },
        },
        404: { description: "Order instruction not found" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/order-instructions",
    summary: "Create a new order instruction",
    tags: ["Order Instructions"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: OrderInstructionRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Order instruction created",
            content: {
                "application/json": { schema: OrderInstructionResponse },
            },
        },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "put",
    path: "/v1/order-instructions/{id}",
    summary: "Update order instruction by ID",
    tags: ["Order Instructions"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: OrderInstructionRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Order instruction updated",
            content: {
                "application/json": { schema: OrderInstructionResponse },
            },
        },
        404: { description: "Order instruction not found" },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/order-instructions/{id}",
    summary: "Delete order instruction by ID",
    tags: ["Order Instructions"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "Order instruction deleted",
            content: {
                "application/json": { schema: OrderInstructionResponse },
            },
        },
        404: { description: "Order instruction not found" },
        401: { description: "Unauthorized" },
    },
});
