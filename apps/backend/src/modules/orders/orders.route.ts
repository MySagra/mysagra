import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { ForbiddenError } from "@/common/errors";
import { OrdersService } from "@/modules/orders/orders.service";
import {
    OrderResponseSchema,
    OrderDetailResponseSchema,
    OrdersResponseSchema,
    CreateOrderSchema,
    ConfirmOrderSchema,
    PatchOrderSchema,
    ReprintOrderSchema,
    GetOrdersQuerySchema,
    OrderIdParamSchema,
    PatchOrderStationStatusParamsSchema,
    PatchOrderStationInputSchema,
} from "@mysagra/schemas";

const service = new OrdersService();

const PaginatedOrdersResponseSchema = z.object({
    orders: OrdersResponseSchema,
    pagination: z.object({
        totalItems: z.number().int().meta({ description: "Items per page", example: 20 }),
        currentPage: z.number().int().meta({ description: "Current page", example: 1 }),
        totalPages: z.number().int().meta({ description: "Total number of page", example: 5 }),
    }),
}).meta({ id: "PaginatedOrdersResponse", description: "Paginated list of orders with metadata" });

export const ordersModule = createModule({
    basePath: "/v1/orders",
    tags: ["Orders"],
    limiter: apiLimiter,
    commonResponses: {
        ...AUTH_RESPONSES,
        403: { description: "Forbidden - API key cannot confirm orders" },
    },
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get orders (paginated)",
            description:
                "Returns a paginated and filtered list of orders. Use `GET /v1/orders/{id}` for full order details.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            query: GetOrdersQuerySchema,
            responses: {
                200: { description: "Paginated list of orders", schema: PaginatedOrdersResponseSchema },
                400: { description: "Invalid query parameters" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getOrders(req.validated.query));
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get order details by ID",
            description:
                "Returns the complete order with items grouped by food category. Each category group contains the full food details (name, price, description, ingredients) and per-item pricing.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: OrderIdParamSchema,
            responses: {
                200: { description: "Full order details with categorized items", schema: OrderDetailResponseSchema },
                400: { description: "Invalid order ID" },
                404: { description: "Not Found - Order not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getOrderById(req.validated.params.id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new order",
            description:
                "Creates a new order in PENDING status. If `confirm` data is provided the order is immediately confirmed and a ticket number is assigned.\n\n" +
                "**API key authentication (`ms_wb_`):** only unconfirmed (PENDING) orders can be created — the `confirm` field is ignored.",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_"])],
            body: CreateOrderSchema,
            responses: {
                201: { description: "Order created", schema: OrderResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
            },
            handler: async (req, res) => {
                const { confirm } = req.validated.body;
                if (confirm && req.apiKey && !req.user) {
                    throw new ForbiddenError("API key cannot confirm orders");
                }
                res.status(201).json(await service.createOrder(req.validated.body));
            },
        }),
        route({
            method: "post",
            path: "/{id}/confirm",
            summary: "Confirm a pending order",
            description: "Confirms a PENDING order, assigns a ticket number and stores payment information.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: OrderIdParamSchema,
            body: ConfirmOrderSchema,
            responses: {
                201: { description: "Order confirmed", schema: OrderResponseSchema },
                400: { description: "Invalid input or order already confirmed" },
                404: { description: "Not Found - Order not found" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.confirmOrder(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Update order status",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: OrderIdParamSchema,
            body: PatchOrderSchema,
            responses: {
                200: { description: "Order status updated", schema: OrderResponseSchema },
                404: { description: "Not Found - Order not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updateStatus(req.validated.params.id, req.validated.body.status));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete or cancel order by ID",
            description:
                "Deletes or cancels an order based on its status:\n\n" +
                "- **PENDING orders**: Completely deleted from the database.\n" +
                "- **Confirmed/Completed/Picked-up orders**: Changed to CANCELLED status. Report statistics for the time window containing the order are automatically updated to exclude this order.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: OrderIdParamSchema,
            responses: {
                200: { description: "Order deleted or cancelled" },
                404: { description: "Not Found - Order not found" },
            },
            handler: async (req, res) => {
                await service.deleteOrder(req.validated.params.id);
                res.status(204).send();
            },
        }),
        route({
            method: "post",
            path: "/{id}/reprint",
            summary: "Reprint order receipt or items",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            params: OrderIdParamSchema,
            body: ReprintOrderSchema,
            responses: {
                200: { description: "Reprint triggered" },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - Order not found" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.reprintOrder(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{orderId}/stations/{stationId}",
            summary: "Update order station status",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: PatchOrderStationStatusParamsSchema,
            body: PatchOrderStationInputSchema,
            responses: {
                200: { description: "Order station status updated" },
                404: { description: "Not Found - Order or station not found" },
            },
            handler: async (req, res) => {
                const { orderId, stationId } = req.validated.params;
                res.status(200).json(await service.updateOrderStationStatus(orderId, stationId, req.validated.body.status));
            },
        }),
    ],
});
