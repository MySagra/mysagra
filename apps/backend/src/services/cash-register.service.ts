import { Prisma } from "@/generated/prisma_client";
import { CreateCashRegisterInput, GetCashRegisterQueryParams, PatchCashRegister, UpdateCashRegisterInput } from "@/schemas/cash-register";
import prisma from "@/utils/prisma";

export class CashRegisterService {
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

        return await prisma.cashRegister.findUnique({
            where: {
                id
            },
            include
        })
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
}