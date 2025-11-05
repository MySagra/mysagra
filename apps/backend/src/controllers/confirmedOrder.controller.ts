import { Request, Response, NextFunction } from "express";
import { ConfirmedOrderService } from "@/services/confirmedOrder.service";
import { ConfirmedOrder } from "@/schemas";
import { asyncHandler } from "@/utils/asyncHandler";
import { Prisma } from "@generated/prisma_client";

type DtoConfirmedOrderRequest = Request<any, any, ConfirmedOrder, any>

export class ConfirmedOrderController {
    constructor(private confirmedOrderService: ConfirmedOrderService) { }

    createConfirmOrder = asyncHandler(async (req: DtoConfirmedOrderRequest, res: Response, next: NextFunction): Promise<void> => {
        const order = req.body
        try {
            const confirmedOrder = await this.confirmedOrderService.createConfirmedOrder(order);
            res.status(201).json(confirmedOrder);
            return;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    res.status(404).json({ error: "Order not found" })
                    return;
                }
                if (error.code === 'P2002') {
                    res.status(409).json({ error: "Order already confirmed" })
                    return;
                }
            }
            res.status(500).json({ error: "Server error" })
        }
    })

}