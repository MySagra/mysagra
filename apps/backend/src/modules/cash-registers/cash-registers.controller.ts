import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { CashRegistersService } from "@/modules/cash-registers/cash-registers.service";
import {
    CreateCashRegisterInput,
    GetCashRegisterQueryParams,
    PatchCashRegister,
    UpdateCashRegisterInput,
    CUIDParam
} from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { ForbiddenError } from "@/common/errors";

export class CashRegistersController {
    constructor(private cashRegisterService: CashRegistersService) { }

    getCashRegisters = asyncHandler(async (
        req: TypedRequest<{ query: GetCashRegisterQueryParams }>,
        res: Response,
    ): Promise<void> => {
        if (req.user?.role === "operator" && req.validated.query.enabled !== true) {
            throw new ForbiddenError("Operators can only access enabled cash registers");
        }

        const cashRegisters = await this.cashRegisterService.getCashRegisters(req.validated.query)
        res.status(200).json(cashRegisters);
    });

    getCashRegisterById = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, query: GetCashRegisterQueryParams }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const cashRegister = await this.cashRegisterService.getCashRegisterById(id, req.validated.query)
        res.status(200).json(cashRegister);
    });

    createCashRegister = asyncHandler(async (
        req: TypedRequest<{ body: CreateCashRegisterInput }>,
        res: Response,
    ): Promise<void> => {
        const cashRegister = await this.cashRegisterService.createCashRegister(req.validated.body)

        res.status(201).json(cashRegister);
    });

    updateCashRegister = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: UpdateCashRegisterInput }>,
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

    openDrawer = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const data = await this.cashRegisterService.openDrawer(id)

        res.status(201).json(data);
    });
}