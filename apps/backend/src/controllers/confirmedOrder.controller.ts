import { Request, Response, NextFunction } from "express";
import { ConfirmedOrderService } from "@/services/confirmedOrder.service";
import { ConfirmedOrder } from "@/schemas";
import { asyncHandler } from "@/utils/asyncHandler";

type DtoConfirmedOrderRequest = Request<any, any, ConfirmedOrder, any>

export class ConfirmedOrderController {
    constructor(private confirmedOrderService: ConfirmedOrderService) { }

    createConfirmOrder = asyncHandler(async (req: DtoConfirmedOrderRequest, res: Response, next: NextFunction): Promise<void> => {
        const order = req.body
        const confirmedOrder = await this.confirmedOrderService.createConfirmedOrder(order);
        res.status(201).json(confirmedOrder);
    })

}