import { prisma } from "@mysagra/database";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { randomBytes } from "node:crypto";

export class SetupService {
    private static instance: SetupService

    private static isSetup: boolean
    private static token: string | null

    private constructor() {
        prisma.user.count().then(c => {
            if (c > 0) { // if the system has no user is a new system
                SetupService.isSetup = true
                SetupService.token = null
            } else {
                SetupService.isSetup = false
                SetupService.token = env.SETUP_TOKEN ? env.SETUP_TOKEN : randomBytes(16).toString("hex")

                // the token lives only in memory: whoever installs reads it from the logs
                logger.warn(`Initial setup required. Setup token: ${SetupService.token}`)
            }
        })
    }

    static getInstance(): SetupService {
        if (!SetupService.instance) {
            SetupService.instance = new SetupService()
        }
        return SetupService.instance
    }

    static getStatus():boolean {
        return SetupService.isSetup
    }

    static createSetup() {
        
    }

}

export const setupService = SetupService.getInstance();