import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { OrderService } from "@/services/order.service";
import { ConfirmedOrder, OrderQuery, orderQuerySchema, orderSchema } from "@/schemas/order";
import { NumberIdParam } from "@/schemas";
import { ConfirmedOrderService } from "@/services/confirmedOrder.service";

export class OrderController {
    constructor(private orderService: OrderService, private confirmedOrderService: ConfirmedOrderService) { }

    getOrders = asyncHandler(async (req: Request<any, any, any, OrderQuery>, res: Response, next: NextFunction) => {
        const parsed = orderQuerySchema.safeParse(req.query)
        
        if(parsed.error){
            res.status(400).json({ message: "Bad request" });
            return;
        }

        const orders = await this.orderService.getOrders(parsed.data);

        if (!orders) {
            return res.status(404).json({ message: "No orders found" });
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

    createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const parsed = orderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
        }
        const orderData = parsed.data;
        const newOrder = await this.orderService.createOrder(orderData);
        res.status(201).json(newOrder);
    });

    confirmOrder = asyncHandler(async (req: Request<NumberIdParam, any, ConfirmedOrder, any>, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const confirmedOrder = await this.confirmedOrderService.confirmExistingOrder(id, req.body);
        res.status(201).json(confirmedOrder);
        return;
    });

    deleteOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const code = req.params.code;
        await this.orderService.deleteOrder(code);

        res.status(204).send();
    });
}