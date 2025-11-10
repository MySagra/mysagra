import { NextFunction, Request, Response } from "express";
import prisma from "@/utils/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { OrderService } from "@/services/order.service";
import { OrderQuery, orderSchema } from "@/schemas/order";

export class OrderController {
    constructor(private orderService: OrderService) { }

    getOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const page = req.query.page ? Number(req.query.page) : 1;
        const orders = await this.orderService.getOrders(page);

        if (!orders) {
            return res.status(404).json({ message: "No orders found" });
        }

        res.status(200).json(orders);
    });

    getDailyOrders = asyncHandler(async (req: Request<any, any, any, OrderQuery>, res: Response, next: NextFunction) => {
        const { exclude } = req.query;
        const orders = await this.orderService.getDailyOrders(exclude);

        if (!orders) {
            return res.status(404).json({ message: "No daily orders found" });
        }

        res.status(200).json(orders);
    });

    getOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const code = req.params.code;
        const order = await this.orderService.getOrderByCode(code);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    });

    searchOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { value } = req.params
        const orders = await this.orderService.searchOrder(value);

        if (!orders) {
            return res.status(404).json({ message: "No orders found" });
        }

        res.status(200).json(orders);
    });

    searchDailyOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { value } = req.params
        const orders = await this.orderService.searchDailyOrder(value);
        if (!orders) {
            return res.status(404).json({ message: "No daily orders found" });
        }
        res.status(200).json(orders);
    });

    createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const parsed = orderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
        }
        const orderData = parsed.data;
        const newOrder = await this.orderService.createOrder(orderData);
        res.status(201).json(newOrder);
    });

    deleteOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const code = req.params.code;
        await this.orderService.deleteOrder(code);

        res.status(204).send();
    });
}