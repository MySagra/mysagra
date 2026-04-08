import { TypedRequest } from "@/types/request";
import { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { OrderInstructionsService } from "./order-instructions.service";
import { CreateOrderInstruction, CUIDParam, UpdateOrderInstruction } from "@mysagra/schemas";

export class OrderInstructionsController {
    constructor(private orderInstructionService: OrderInstructionsService) { }

    getOrderInstructions = asyncHandler(async (
        _req: TypedRequest<{}>,
        res: Response
    ): Promise<void> => {
        const orderInstructions = await this.orderInstructionService.getOrderInstructions()
        res.status(200).json(orderInstructions)
    })

    getOrderInstruction = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response
    ): Promise<void> => {
        const { id } = req.validated.params
        const orderInstructions = await this.orderInstructionService.getOrderInstruction(id);
        if (!orderInstructions) {
            res.status(404).json({
                status: "error",
                message: "Not Found"
            })
            return;
        }

        res.status(200).json(orderInstructions)
    })

    createOrderInstruction = asyncHandler(async (
        req: TypedRequest<{ body: CreateOrderInstruction }>,
        res: Response
    ): Promise<void> => {
        const orderInstructions = await this.orderInstructionService.createOrderInstruction(req.validated.body)
        res.status(201).json(orderInstructions)
    })

    updateOrderInstruction = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: UpdateOrderInstruction }>,
        res: Response
    ): Promise<void> => {
        const { id } = req.validated.params
        const orderInstructions = await this.orderInstructionService.updateOrderInstruction(id, req.validated.body)
        res.status(201).json(orderInstructions)
    })

    deleteOrderInstruction = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response
    ): Promise<void> => {
        const { id } = req.validated.params

        const orderInstructions = await this.orderInstructionService.deleteOrderInstruction(id);
        res.status(200).json(orderInstructions)
    })
}