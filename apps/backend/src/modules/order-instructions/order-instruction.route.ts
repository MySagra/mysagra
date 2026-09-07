import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { OrderInstructionsService } from "./order-instructions.service";
import {
    CreateOrderInstructionSchema,
    UpdateOrderInstructionSchema,
    OrderInstructionResponseSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new OrderInstructionsService();

export const orderInstructionsModule = createModule({
    basePath: "/v1/order-instructions",
    tags: ["Order Instructions"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all order instructions",
            description:
                "Returns all order instructions. " +
                "Accessible by admin, maintainer, and operator roles, as well as via WEBAPP API key (`ms_wb_`).",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_"])],
            responses: {
                200: { description: "List of order instructions", schema: z.array(OrderInstructionResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await service.getOrderInstructions());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get order instruction by ID",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_wb_"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Order instruction found", schema: OrderInstructionResponseSchema },
                404: { description: "Not Found - Order instruction not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getOrderInstruction(req.validated.params.id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new order instruction",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            body: CreateOrderInstructionSchema,
            responses: {
                201: { description: "Order instruction created", schema: OrderInstructionResponseSchema },
                400: { description: "Invalid input" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createOrderInstruction(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update order instruction by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            body: UpdateOrderInstructionSchema,
            responses: {
                200: { description: "Order instruction updated", schema: OrderInstructionResponseSchema },
                400: { description: "Invalid input" },
                404: { description: "Not Found - Order instruction not found" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.updateOrderInstruction(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete order instruction by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Order instruction deleted", schema: OrderInstructionResponseSchema },
                404: { description: "Not Found - Order instruction not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.deleteOrderInstruction(req.validated.params.id));
            },
        }),
    ],
});
