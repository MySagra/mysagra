import { NotFoundError } from "@/common/errors";
import { prisma } from "@mysagra/database";
import { Sagra } from "@mysagra/schemas";

export class SagraService {
    private static instance: SagraService
    private config: Sagra | null = null

    private constructor() {
        this.loadConfig()
    }

    static getInstance(): SagraService {
        if (!SagraService.instance) {
            SagraService.instance = new SagraService()
        }
        return SagraService.instance
    }

    async loadConfig() {
        const config = await prisma.sagra.findFirst()
        if (!config) {
            this.config = await prisma.sagra.create({
                data: { name: "MySagra" }
            })
        }
        this.config = config
    }

    async updateSagra(data: Sagra) {
        if (!this.config) {
            throw new NotFoundError("Can't update a sagra that doesn't exists")
        }

        return await prisma.$transaction(async (tx) => {
            const updatedConfig = await tx.sagra.update({
                where: { id: this.config?.id },
                data: data
            });

            this.config = updatedConfig;
            return updatedConfig;
        })
    }

    async updateLastClosing(date: Date) {
        return await prisma.$transaction(async (tx) => {
            if (!this.config) {
                throw new NotFoundError("Can't update a sagra that doesn't exists")
            }

            const updatedConfig = await tx.sagra.update({
                where: { id: this.config?.id },
                data: { lastClosingAt: date }
            });

            this.config = updatedConfig
            return updatedConfig;
        })
    }
}

export const sagraService = SagraService.getInstance();