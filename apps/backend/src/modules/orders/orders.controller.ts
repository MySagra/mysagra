import { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { TypedRequest } from "@/types/request";
import { OrdersService } from "@/modules/orders/orders.service";
import {
    ConfirmOrderInput,
    GetOrdersQueryParams,
    CreateOrder,
    OrderIdParam,
    PatchOrderInput,
    ReprintOrder
} from "@mysagra/schemas";
import { ForbiddenError } from "@/common/errors";

export class OrdersController {
    constructor(private orderService: OrdersService) { }

    getOrders = asyncHandler(async (
        req: TypedRequest<{query: GetOrdersQueryParams}>,
        res: Response, 
    ): Promise<void> => {
        const orders = await this.orderService.getOrders(req.validated.query);
        res.status(200).json(orders);
    });

    getOrderById = asyncHandler(async (
        req: TypedRequest<{params: OrderIdParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const order = await this.orderService.getOrderById(id);
        res.status(200).json(order);
    });

    createOrder = asyncHandler(async (
        req: TypedRequest<{body: CreateOrder}>,
        res: Response,
    ): Promise<void> => {
        const { confirm } = req.validated.body;

        if((confirm && (req.apiKey && !req.user))){
            throw new ForbiddenError("API key cannot confirm orders");
        }

        const newOrder = await this.orderService.createOrder(req.validated.body);
        res.status(201).json(newOrder);
    });

    confirmOrder = asyncHandler(async (
        req: TypedRequest<{params: OrderIdParam, body: ConfirmOrderInput}>,
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;

        const confirmedOrder = await this.orderService.confirmOrder(id, req.validated.body);
        res.status(201).json(confirmedOrder);
    });

    patchOrder = asyncHandler(async (
        req: TypedRequest<{params: OrderIdParam, body: PatchOrderInput}>,
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

    reprintOrder = asyncHandler(async (
        req: TypedRequest<{params: OrderIdParam, body: ReprintOrder}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const order = await this.orderService.reprintOrder(id, req.body)
        res.status(201).json(order)
    })
}