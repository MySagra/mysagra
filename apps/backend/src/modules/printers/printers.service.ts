import { PatchPrinterInput, CreatePrinterInput, UpdatePrinterInput } from "@mysagra/schemas";
import { prisma } from "@mysagra/database";
import { EventsService } from "../events/events.service";
import { NotFoundError } from "@/common/errors";

export class PrintersService {
    private cashierEvent = EventsService.getInstance('cashier');

    async getPrinters() {
        return await prisma.printer.findMany();
    }

    async getPrinterById(id: string) {
        const printers = await prisma.printer.findUnique({
            where: {
                id
            }
        })

        if(!printers){
            throw new NotFoundError("Printer not found")
        }
        
        return printers;
    }

    async createPrinter(printer: CreatePrinterInput) {
        return await prisma.printer.create({
            data: printer
        })
    }

    async updatePrinter(id: string, printer: UpdatePrinterInput) {
        const updatedPrinter = await prisma.printer.update({
            where: {
                id
            },
            data: printer
        })

        this.cashierEvent.broadcastEvent(
            {
                id,
                status: updatedPrinter.status
            },
            "printer-status-changed"
        )

        return updatedPrinter;
    }

    async patchPrinter(id: string, printer: PatchPrinterInput) {
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
                status: patchedPrinter.status
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