import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { PrinterService } from "@/services/printer.service";
import { Printer } from "@/schemas/printer";
import { CUIDParam } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class PrinterController {
    constructor(private printerService: PrinterService) { }

    getPrinters = asyncHandler(async (
        req: TypedRequest<{}>,
        res: Response,
    ): Promise<void> => {
        const printers = await this.printerService.getPrinters()

        if (!Array.isArray(printers)) {
            res.status(404).json({ message: "Printers not found" })
            return;
        }
        res.status(200).json(printers);
    });

    getPrinterById = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const printer = await this.printerService.getPrinterById(id)

        if (!printer) {
            res.status(404).json({ message: "Printers not found" })
            return;
        }
        res.status(200).json(printer);
    });

    createPrinter = asyncHandler(async (
        req: TypedRequest<{ body: Printer }>,
        res: Response,
    ): Promise<void> => {
        const printer = await this.printerService.createPrinter(req.validated.body)

        res.status(201).json(printer);
    });

    updatePrinter = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: Printer }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const printer = await this.printerService.updatePrinter(id, req.validated.body)

        res.status(200).json(printer);
    });

    deletePrinter = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        await this.printerService.deletePrinter(id)

        res.status(204).send();
    });
}