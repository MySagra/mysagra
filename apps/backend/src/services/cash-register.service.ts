import { Prisma } from "@/generated/prisma_client";
import { CashRegister, GetCashRegisterQuery, PatchCashRegister } from "@/schemas/cash-register";
import prisma from "@/utils/prisma";

export class CashRegisterService {
    async getCashRegisters(queryParams?: GetCashRegisterQuery) {
        const include: Prisma.CashRegisterInclude = {}

        if (queryParams?.include === "printer") {
            include.defaultPrinter = true
        }

        return await prisma.cashRegister.findMany({
            include
        });
    }

    async getCashRegisterById(id: string, queryParams?: GetCashRegisterQuery) {
        const include: Prisma.CashRegisterInclude = {}

        if (queryParams?.include === "printer") {
            include.defaultPrinter = true
        }

        return await prisma.cashRegister.findUnique({
            where: {
                id
            },
            include
        })
    }

    async createCashRegister(cashRegister: CashRegister) {
        return await prisma.cashRegister.create({
            data: cashRegister
        })
    }

    async updateCashRegister(id: string, cashRegister: CashRegister) {
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
}