import { prisma } from "@mysagra/database";
import { SettingsDataSchema, SettingsResponse, UpdateSettings } from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";
import { sagraService } from "../sagra/sagra.service";

// same fields for read and update, mapped to SettingsResponse by toResponse
const settingsSelect = {
    name: true,
    settings: { select: { data: true, updatedAt: true } }
} as const;

type SagraWithSettings = {
    name: string;
    settings: { data: unknown; updatedAt: Date } | null;
};

export class SettingService {
    private static instance: SettingService

    // settings are read on every order: kept in memory, replaced as a whole on update
    private cache: SettingsResponse | null = null;

    private constructor() { }

    static getInstance(): SettingService {
        if (!SettingService.instance) {
            SettingService.instance = new SettingService()
        }
        return SettingService.instance
    }

    private getSagraId(): string {
        const sagraId = sagraService.getConfig()?.id;
        if (!sagraId) throw new NotFoundError("The sagra is not configured yet");
        return sagraId;
    }

    // `settings` is null on installations created before the settings table: defaults apply.
    // The parse also completes documents saved before a new setting was added.
    private toResponse(sagra: SagraWithSettings): SettingsResponse {
        return {
            sagra: { name: sagra.name },
            settings: SettingsDataSchema.parse(sagra.settings?.data ?? {}),
            updatedAt: sagra.settings?.updatedAt ?? null
        };
    }

    async getSettings(): Promise<SettingsResponse> {
        if (this.cache) return this.cache;

        const sagra = await prisma.sagra.findUniqueOrThrow({
            where: { id: this.getSagraId() },
            select: settingsSelect
        });

        this.cache = this.toResponse(sagra);
        return this.cache;
    }

    async updateSettings(input: UpdateSettings): Promise<SettingsResponse> {
        const sagra = await prisma.sagra.update({
            where: { id: this.getSagraId() },
            data: {
                name: input.sagra.name,
                // creates the settings row on installations that don't have it yet
                settings: {
                    upsert: {
                        create: { data: input.settings },
                        update: { data: input.settings }
                    }
                }
            },
            select: settingsSelect
        });

        this.cache = this.toResponse(sagra);

        // the sagra name is cached by sagraService too
        await sagraService.loadConfig();

        return this.cache;
    }
}

export const settingService = SettingService.getInstance();
