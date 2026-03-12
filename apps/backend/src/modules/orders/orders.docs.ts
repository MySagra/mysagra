import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    OrderResponseSchema,
    OrderItemResponseSchema,
    CreateOrderSchema,
    ConfirmOrderSchema,
    PatchOrderSchema,
    ReprintOrderSchema,
    GetOrdersQuerySchema,
    OrderIdParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const OrderResponse = registry.register("OrderResponse", OrderResponseSchema);
registry.register("OrderItemResponse", OrderItemResponseSchema);
const CreateOrderRequest = registry.register("CreateOrderRequest", CreateOrderSchema);
const ConfirmOrderRequest = registry.register("ConfirmOrderRequest", ConfirmOrderSchema);
const PatchOrderRequest = registry.register("PatchOrderRequest", PatchOrderSchema);
const ReprintOrderRequest = registry.register("ReprintOrderRequest", ReprintOrderSchema);
const GetOrdersQuery = registry.register("GetOrdersQuery", GetOrdersQuerySchema);
const OrderIdParam = registry.register("OrderIdParam", OrderIdParamSchema);

const PaginatedOrdersResponse = z.object({
    orders: z.array(OrderResponse),
    pagination: z.object({
        currentPage: z.number().int().meta({ example: 1 }),
        totalOrdersPages: z.number().int().meta({ example: 5 }),
        totalOrdersItems: z.number().int().meta({ example: 100 }),
        itemsPerPage: z.number().int().meta({ example: 20 }),
        hasNextPage: z.boolean(),
        hasPrevPage: z.boolean(),
        nextPage: z.number().int().nullable().meta({ example: 2 }),
        prevPage: z.number().int().nullable(),
    }),
}).meta({
    id: "PaginatedOrdersResponse",
    description: "Paginated list of orders with metadata",
});

const PaginatedOrders = registry.register("PaginatedOrdersResponse", PaginatedOrdersResponse);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/orders",
    summary: "Get orders (paginated)",
    description:
        "Returns a paginated and filtered list of orders. Use `GET /v1/orders/{id}` for full order details.",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: { query: GetOrdersQuery },
    responses: {
        200: {
            description: "Paginated list of orders",
            content: {
                "application/json": { schema: PaginatedOrders },
            },
        },
        400: { description: "Invalid query parameters" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/orders/{id}",
    summary: "Get order details by ID",
    description:
        "Returns the complete order with items grouped by category, including full food and ingredient details.",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: { params: OrderIdParam },
    responses: {
        200: {
            description: "Full order details",
            content: {
                "application/json": { schema: OrderResponse },
            },
        },
        400: { description: "Invalid order ID" },
        404: { description: "Order not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/orders",
    summary: "Create a new order",
    description:
        "Creates a new order in PENDING status. If `confirm` data is provided the order is immediately confirmed and a ticket number is assigned.",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateOrderRequest },
            },
        },
    },
    responses: {
        201: {
            description: "Order created",
            content: {
                "application/json": { schema: OrderResponse },
            },
        },
        400: { description: "Invalid input" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/orders/{id}/confirm",
    summary: "Confirm a pending order",
    description:
        "Confirms a PENDING order, assigns a ticket number and stores payment information.",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: {
        params: OrderIdParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: ConfirmOrderRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Order confirmed",
            content: {
                "application/json": { schema: OrderResponse },
            },
        },
        400: { description: "Invalid input or order already confirmed" },
        404: { description: "Order not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "patch",
    path: "/v1/orders/{id}",
    summary: "Update order status",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: {
        params: OrderIdParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: PatchOrderRequest },
            },
        },
    },
    responses: {
        200: {
            description: "Order status updated",
            content: {
                "application/json": { schema: OrderResponse },
            },
        },
        404: { description: "Order not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/orders/{id}/reprint",
    summary: "Reprint order receipt or items",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: {
        params: OrderIdParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: ReprintOrderRequest },
            },
        },
    },
    responses: {
        200: { description: "Reprint triggered" },
        400: { description: "Invalid input" },
        404: { description: "Order not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/orders/{id}",
    summary: "Delete order by ID",
    tags: ["Orders"],
    security: [{ cookieAuth: [] }],
    request: { params: OrderIdParam },
    responses: {
        200: { description: "Order deleted" },
        404: { description: "Order not found" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
    },
});
