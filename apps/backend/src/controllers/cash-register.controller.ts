import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { CashRegisterService } from "@/services/cash-register.service";
import { CashRegister, GetCashRegisterQuery, PatchCashRegister } from "@/schemas/cash-register";
import { CUIDParam } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class CashRegisterController {
    constructor(private cashRegisterService: CashRegisterService) { }

    getCashRegisters = asyncHandler(async (
        req: TypedRequest<{ query: GetCashRegisterQuery }>,
        res: Response,
    ): Promise<void> => {
        const cashRegisters = await this.cashRegisterService.getCashRegisters(req.validated.query)

        if (!Array.isArray(cashRegisters)) {
            res.status(404).json({ message: "CashRegisters not found" })
            return;
        }
        res.status(200).json(cashRegisters);
    });

    getCashRegisterById = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, query: GetCashRegisterQuery }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const cashRegister = await this.cashRegisterService.getCashRegisterById(id, req.validated.query)

        if (!cashRegister) {
            res.status(404).json({ message: "CashRegisters not found" })
            return;
        }
        res.status(200).json(cashRegister);
    });

    createCashRegister = asyncHandler(async (
        req: TypedRequest<{ body: CashRegister }>,
        res: Response,
    ): Promise<void> => {
        const cashRegister = await this.cashRegisterService.createCashRegister(req.validated.body)

        res.status(201).json(cashRegister);
    });

    updateCashRegister = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: CashRegister }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const cashRegister = await this.cashRegisterService.updateCashRegister(id, req.validated.body)

        res.status(200).json(cashRegister);
    });

    patchCashRegister = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: PatchCashRegister }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const cashRegister = await this.cashRegisterService.patchCashRegister(id, req.validated.body)

        res.status(200).json(cashRegister);
    });

    deleteCashRegister = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.cashRegisterService.deleteCashRegister(id)

        res.status(204).send();
    });
}