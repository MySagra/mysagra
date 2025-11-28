import { PatchPrinterInput, CreatePrinterInput, UpdatePrinterInput } from "@/schemas/printer";
import prisma from "@/utils/prisma";
import { EventService } from "./event.service";

export class PrinterService {
    private cashierEvent = EventService.getIstance('cashier');

    async getPrinters() {
        return await prisma.printer.findMany();
    }

    async getPrinterById(id: string) {
        return await prisma.printer.findUnique({
            where: {
                id
            }
        })
    }

    async createPrinter(printer: CreatePrinterInput) {
        return await prisma.printer.create({
            data: printer
        })
    }

    async updatePrinter(id: string, printer: UpdatePrinterInput) {
        return await prisma.printer.update({
            where: {
                id
            },
            data: printer
        })
    }

    async patchPrinter(id: string, printer: PatchPrinterInput){
        const patchedPrinter = await prisma.printer.update({
            where: {
                id
            },
            data: {
                status: printer.status
            }
        })

        this.cashierEvent.broadcastEvent(
            {
                id,
                status: printer.status
            },
            "printer-status-changed"
        )
        
        return patchedPrinter;
    }

    async deletePrinter(id: string) {
        return await prisma.printer.delete({
            where: {
                id
            }
        })
    }
}