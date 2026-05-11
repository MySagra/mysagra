import { prisma, Prisma } from "@mysagra/database";
import {
    CreateCashRegisterInput,
    GetCashRegisterQueryParams,
    PatchCashRegister,
    UpdateCashRegisterInput
} from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";
import { EventsService } from "../events/events.service";

export class CashRegistersService {
    private printerEvent = EventsService.getIstance('printer');
    
    async getCashRegisters(queryParams?: GetCashRegisterQueryParams) {
        const where: Prisma.CashRegisterWhereInput = {};
        const include: Prisma.CashRegisterInclude = {}

        if (queryParams?.include === "printer") {
            include.defaultPrinter = true
        }

        if(queryParams?.enabled !== undefined){
            where.enabled = queryParams.enabled;
        }

        return await prisma.cashRegister.findMany({
            where,
            include
        });
    }

    async getCashRegisterById(id: string, queryParams?: GetCashRegisterQueryParams) {
        const include: Prisma.CashRegisterInclude = {}

        if (queryParams?.include === "printer") {
            include.defaultPrinter = true
        }

        const cashRegister = await prisma.cashRegister.findUnique({
            where: {
                id
            },
            include
        });

        if (!cashRegister) {
            throw new NotFoundError("Cash register not found");
        }

        return cashRegister;
    }

    async createCashRegister(cashRegister: CreateCashRegisterInput) {
        return await prisma.cashRegister.create({
            data: cashRegister
        })
    }

    async updateCashRegister(id: string, cashRegister: UpdateCashRegisterInput) {
        return await prisma.cashRegister.update({
            where: {
                id
            },
            data: cashRegister
        })
    }

    async patchCashRegister(id: string, patchCashRegister: PatchCashRegister){
        return await prisma.cashRegister.update({
            where: {
                id
            },
            data: patchCashRegister
        })
    }

    async deleteCashRegister(id: string) {
        return await prisma.cashRegister.delete({
            where: {
                id
            }
        })
    }

    async openDrawer(id: string){
        const cashRegister = await prisma.cashRegister.findUnique({
            where: { id },
            select: { id: true, defaultPrinterId: true }
        })

        if(!cashRegister){
            throw new NotFoundError(`Cash register with id: ${id} not found`)
        }

        this.printerEvent.broadcastEvent(
            {
                cashRegisterId: cashRegister.id,
                printerId: cashRegister.defaultPrinterId
            },
            "open-drawer"
        )

        return cashRegister;
    }
}