import { NotFoundError } from "@/common/errors";
import { prisma } from "@mysagra/database";
import { Sagra } from "@mysagra/schemas";
import { Queue } from "bullmq"
import { redisConnection } from "@/lib/redis"

export class SagraService {
    private static instance: SagraService
    private config: Sagra | null = null
    private reportQueue = new Queue('report-queue', { connection: redisConnection })

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
        return config;
    }

    getConfig() {
        return this.config
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
        }).then(async (config) => {
            await this.scheduleAutomation();
            return config;
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
        }).then(async (config) => {
            await this.scheduleAutomation();
            return config;
        })
    }

    public async scheduleAutomation() {
        if (!this.config) return;

        const schedulerId = `report-automation-${this.config.id}`;
        const intervalMs = this.config.statsIntervalMinutes * 60 * 1000;

        // upsertJobScheduler is the modern V5 way to handle repeatable jobs.
        // It automatically manages the lifecycle: if the interval changes, 
        // it updates the existing scheduler instead of creating duplicates.
        await this.reportQueue.upsertJobScheduler(
            schedulerId,
            {
                every: intervalMs,
            },
            {
                name: 'auto-generate-report',
                data: { sagraId: this.config.id },
                // You can still pass job-specific options here
                opts: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 1000 }
                }
            }
        );
    }
}

export const sagraService = SagraService.getInstance();