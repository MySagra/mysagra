import { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { TypedRequest } from "@/types/request";
import { OrderService } from "@/services/order.service";
import { ConfirmOrderInput, GetOrdersQueryParams, CreateOrder, OrderIdParam, PatchOrderInput } from "@/schemas/order";
import { NumberIdParam } from "@/schemas";

export class OrderController {
    constructor(private orderService: OrderService) { }

    getOrders = asyncHandler(async (
        req: TypedRequest<{query: GetOrdersQueryParams}>,
        res: Response, 
    ): Promise<void> => {
        const orders = await this.orderService.getOrders(req.validated.query);

        if (!orders) {
            res.status(404).json({ message: "No orders found" });
            return;
        }

        res.status(200).json(orders);
    });

    getOrderById = asyncHandler(async (
        req: TypedRequest<{params: OrderIdParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const order = await this.orderService.getOrderById(id);

        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.status(200).json(order);
    });

    createOrder = asyncHandler(async (
        req: TypedRequest<{body: CreateOrder}>,
        res: Response, 
    ): Promise<void> => {
        const { confirm } = req.validated.body;

        if((confirm && (req.user?.role === "guest" || !req.user?.role))){
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const newOrder = await this.orderService.createOrder(req.validated.body);
        res.status(201).json(newOrder);
    });

    confirmOrder = asyncHandler(async (
        req: TypedRequest<{params: NumberIdParam, body: ConfirmOrderInput}>,
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;

        const confirmedOrder = await this.orderService.confirmOrder(id, req.validated.body);
        res.status(201).json(confirmedOrder);
    });

    patchOrder = asyncHandler(async (
        req: TypedRequest<{params: NumberIdParam, body: PatchOrderInput}>,
        res: Response, 
    ): Promise<void> => {
        const { status } = req.validated.body;
        const { id } = req.validated.params;

        const order = await this.orderService.updateStatus(id, status);
        res.status(200).json(order);
    });

    deleteOrder = asyncHandler(async (
        req: TypedRequest<{params: OrderIdParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.orderService.deleteOrder(id);

        res.status(204).send();
    });
}