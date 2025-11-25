import { Printer } from "@/schemas/printer";
import prisma from "@/utils/prisma";

export class PrinterService {
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

    async createPrinter(printer: Printer) {
        return await prisma.printer.create({
            data: printer
        })
    }

    async updatePrinter(id: string, printer: Printer) {
        return await prisma.printer.update({
            where: {
                id
            },
            data: printer
        })
    }

    async deletePrinter(id: string) {
        return await prisma.printer.delete({
            where: {
                id
            }
        })
    }
}