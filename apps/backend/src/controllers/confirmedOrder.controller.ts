import { Request, Response, NextFunction } from "express";
import { ConfirmedOrderService } from "@/services/confirmedOrder.service";
import { ConfirmedOrder, ConfirmedOrdersFilter, CreateAndConfirmOrder, CUIDParam, Status } from "@/schemas";
import { asyncHandler } from "@/utils/asyncHandler";
import { Prisma } from "@generated/prisma_client";
import { PatchStatus } from "@/schemas";

export class ConfirmedOrderController {
    constructor(private confirmedOrderService: ConfirmedOrderService) { }

    getConfirmedOrders = asyncHandler(async (req: Request<any, any, any, ConfirmedOrdersFilter>, res: Response, next: NextFunction): Promise<void> => {
        const { filter } = req.query;

        const orders = await this.confirmedOrderService.getConfirmedOrders(filter);
        res.status(200).json(orders);
    })

    createAndConfirmOrder = asyncHandler(async (req: Request<any, any, CreateAndConfirmOrder, any>, res: Response, next: NextFunction): Promise<void> => {
        const order = req.body
        try {
            const confirmedOrder = await this.confirmedOrderService.createAndConfirmOrder(order);
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

    patchStatus = asyncHandler(async (req: Request<CUIDParam, any, PatchStatus>, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { status } = req.body;

        const order = await this.confirmedOrderService.updateStatus(id, status);

        res.status(200).json(order);
    })

}