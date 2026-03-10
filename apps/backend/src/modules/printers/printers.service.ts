import { PatchPrinterInput, CreatePrinterInput, UpdatePrinterInput } from "@mysagra/schemas";
import { prisma } from "@mysagra/database";
import { EventsService } from "../events/events.service";

export class PrintersService {
    private cashierEvent = EventsService.getIstance('cashier');

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