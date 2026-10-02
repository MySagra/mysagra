import { prisma } from "@mysagra/database";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { CreateSetup } from "@mysagra/schemas";
import { ConflictError, UnauthorizedError } from "@/common/errors";
import { createHashPassword } from "@/lib/hashPassword";
import { sagraService } from "../sagra/sagra.service";
import { reportService } from "../report/report.service";

// compares in constant time; timingSafeEqual throws on different lengths, so check them first
function safeEqual(a: string, b: string) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function printSetupBanner(token: string, fromEnv: boolean) {
    const color = process.stdout.isTTY;
    const paint = (code: string, text: string) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
    const yellow = (text: string) => paint("33", text);
    const bold = (text: string) => paint("1", text);
    const dim = (text: string) => paint("2", text);

    const width = 58;
    // pad on the visible text, colors are added afterwards so they don't break the alignment
    const row = (text = "", style: (t: string) => string = (t) => t) =>
        `${yellow("│")}  ${style(text.padEnd(width - 4))}  ${yellow("│")}`;

    const lines = [
        "",
        yellow(`╭${"─".repeat(width)}╮`),
        row(),
        row("  __  __        ____                        ", bold),
        row(" |  \\/  |_   _ / ___|  __ _  __ _ _ __ __ _ ", bold),
        row(" | |\\/| | | | |\\___ \\ / _` |/ _` | '__/ _` |", bold),
        row(" | |  | | |_| | ___) | (_| | (_| | | | (_| |", bold),
        row(" |_|  |_|\\__, ||____/ \\__,_|\\__, |_|  \\__,_|", bold),
        row("         |___/              |___/            ", bold),
        row(),
        row("Welcome! This instance is not configured yet."),
        row(),
        row("Open MySagra in your browser and enter this token:"),
        row(),
        row(`  ${token}`, (t) => yellow(bold(t))),
        row(),
        row(fromEnv ? "Token taken from the SETUP_TOKEN env variable." : "The token is valid until the backend restarts.", dim),
        row("It can be used only once.", dim),
        row(),
        yellow(`╰${"─".repeat(width)}╯`),
        "",
    ];

    process.stdout.write(lines.join("\n") + "\n");
}

export class SetupService {
    private static instance: SetupService

    private isSetup: boolean
    private token: string | null

    private constructor() {
        this.isSetup = true;
        this.token = null;
    }

    static getInstance(): SetupService {
        if (!SetupService.instance) {
            SetupService.instance = new SetupService();
        }
        return SetupService.instance
    }

    async init() {
        const count = await prisma.user.count();

        // Start MySagra, the istance is setupped
        if (count > 0) {
            this.isSetup = true
            this.token = null
            await this.startMySagra();
        } else { // if the system has no user is a new system
            this.isSetup = false
            this.token = env.SETUP_TOKEN ? env.SETUP_TOKEN : randomBytes(16).toString("hex")

            // the token lives only in memory: printed on stdout (console / docker logs), kept out of the log files
            logger.warn("Initial setup required, the setup token is printed in the console output")
            printSetupBanner(this.token, Boolean(env.SETUP_TOKEN))
        }
    }

    private async startMySagra() {
        //load configuration
        await sagraService.loadConfig();

        // initialize report service (backfills missing reports) before worker starts
        await reportService.initReports();

        // start scheduling automation
        await sagraService.scheduleAutomation()
    }

    getStatus(): boolean {
        return this.isSetup
    }

    async createSetup(setup: CreateSetup) {
        if (this.isSetup) {
            throw new ConflictError("The instance is already setup")
        }

        const token = this.token;
        if (!token || !safeEqual(token, setup.token)) {
            throw new UnauthorizedError();
        }

        // single use: taken before any await, so a concurrent request finds it gone
        this.token = null;

        let result;
        try {
            // hashed outside the transaction: bcrypt is slow and would keep it open
            const password = await createHashPassword(setup.user.password);

            result = await prisma.$transaction(async (tx) => {
                const adminRole = await tx.role.findUniqueOrThrow({ where: { name: "admin" } });
                const sagra = await tx.sagra.create({
                    data: {
                        name: setup.sagra.name
                    }
                });

                // settings are stored as a single JSON document, already validated and defaulted by SettingsDataSchema
                await tx.settings.create({
                    data: {
                        sagraId: sagra.id,
                        data: setup.settings
                    }
                })

                await tx.user.create({
                    data: {
                        username: setup.user.username,
                        password,
                        roleId: adminRole.id
                    }
                });

                // banner setup
                await tx.banner.create({
                    data: {
                        label: "MySagra",
                        title: "MySagra",
                        description: "Thank you for choosing us!",
                        website: "https://mysagra.com",
                        type: "SPONSOR",
                        image: "banner-mysagra-default.png",
                        position: 0
                    }
                });

                // settings as validated by SettingsDataSchema (defaults applied), not the raw DB row
                return { sagra, settings: setup.settings }
            });
        } catch (error) {
            this.token = token; // nothing was saved: the setup can be retried
            throw error;
        }

        this.isSetup = true;

        try {
            await this.startMySagra();
        } catch (error) {
            // setup is saved: services will start on the next restart
            logger.error("Setup completed but MySagra services failed to start", error);
        }

        return result;
    }

}

export const setupService = SetupService.getInstance();