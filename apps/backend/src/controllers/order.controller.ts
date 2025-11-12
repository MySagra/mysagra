import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { OrderService } from "@/services/order.service";
import { ConfirmedOrder, OrderQuery, orderQuerySchema, Order } from "@/schemas/order";
import { NumberIdParam } from "@/schemas";

export class OrderController {
    constructor(private orderService: OrderService) { }

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

    getOrderByCode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;
        const order = await this.orderService.getOrderByCode(code);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    });

    createOrder = asyncHandler(async (req: Request<any, any, Order, any>, res: Response, next: NextFunction) => {
        const { confirm } = req.body;

        if((confirm && (req.user?.role === "guest" || !req.user?.role))){
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const newOrder = await this.orderService.createOrder(req.body);
        res.status(201).json(newOrder);
    });

    confirmOrder = asyncHandler(async (req: Request<NumberIdParam, any, ConfirmedOrder, any>, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const confirmedOrder = await this.orderService.confirmOrder(id, req.body);
        res.status(201).json(confirmedOrder);
        return;
    });

    deleteOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const code = req.params.code;
        await this.orderService.deleteOrder(code);

        res.status(204).send();
    });
}