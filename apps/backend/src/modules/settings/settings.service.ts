import { prisma } from "@mysagra/database";
import { SettingsDataSchema, SettingsResponse, UpdateSettings } from "@mysagra/schemas";
import { NotFoundError } from "@/common/errors";
import { sagraService } from "../sagra/sagra.service";
import { ImagesService } from "../images/images.service";
import path from "path";

const RECEIPT_LOGO_FOLDER = "receipt_logo";

// same fields for read and update, mapped to SettingsResponse by toResponse
const settingsSelect = {
    name: true,
    receiptLogo: true,
    settings: { select: { data: true, updatedAt: true } }
} as const;

type SagraWithSettings = {
    name: string;
    receiptLogo: string | null;
    settings: { data: unknown; updatedAt: Date } | null;
};

export class SettingService {
    public static imageService = new ImagesService(RECEIPT_LOGO_FOLDER, 'receipt-logo');
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
            sagra: {
                name: sagra.name,
                // the DB stores the file name, clients get the path to download it (served by express.static)
                receiptLogo: sagra.receiptLogo ? `/uploads/${RECEIPT_LOGO_FOLDER}/${sagra.receiptLogo}` : null
            },
            settings: SettingsDataSchema.parse(sagra.settings?.data ?? {}),
            updatedAt: sagra.settings?.updatedAt ?? null
        };
    }

    // called at startup (and right after the setup) by SetupService.startMySagra
    async loadSettings(): Promise<SettingsResponse> {
        const sagra = await prisma.sagra.findUniqueOrThrow({
            where: { id: this.getSagraId() },
            select: settingsSelect
        });

        this.cache = this.toResponse(sagra);
        return this.cache;
    }

    async getSettings(): Promise<SettingsResponse> {
        return this.cache ?? this.loadSettings();
    }

    // Whether the customer webapp can place orders right now (settings.ordering, in the sagra time zone).
    // Cash desks are never limited: callers check this only for the webapp API key.
    async isOrderingOpen(now = new Date()): Promise<boolean> {
        const { ordering, general } = (await this.getSettings()).settings;
        if (ordering.mode === "OPEN") return true;
        if (ordering.mode === "CLOSED") return false;

        // "HH:mm" in the sagra time zone: same format as opensAt/closesAt, so they compare as strings
        const time = new Intl.DateTimeFormat("en-GB", {
            timeZone: general.timezone,
            hourCycle: "h23",
            hour: "2-digit",
            minute: "2-digit",
        }).format(now);

        const { opensAt, closesAt } = ordering;
        return opensAt < closesAt
            ? time >= opensAt && time < closesAt
            // closes after midnight (e.g. 19:00-01:00)
            : time >= opensAt || time < closesAt;
    }

    // the cache holds the public path, the images service works with the file name
    private currentLogoFile(): string | null {
        const logo = this.cache?.sagra.receiptLogo;
        return logo ? path.basename(logo) : null;
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

    async updateReceiptLogo(file: Express.Multer.File): Promise<SettingsResponse> {
        const oldLogo = this.currentLogoFile();

        // only the DB update is guarded: once it succeeded the new file is referenced and must stay
        let sagra: SagraWithSettings;
        try {
            sagra = await prisma.sagra.update({
                where: { id: this.getSagraId() },
                data: { receiptLogo: file.filename },
                select: settingsSelect
            });
        } catch (error) {
            // the upload middleware already saved the file: don't leave it orphaned
            SettingService.imageService.delete(file.filename);
            throw error;
        }

        // removed only once the DB points to the new file
        if (oldLogo && oldLogo !== file.filename) SettingService.imageService.delete(oldLogo);

        this.cache = this.toResponse(sagra);
        return this.cache;
    }

    async deleteReceiptLogo(): Promise<SettingsResponse> {
        const oldLogo = this.currentLogoFile();

        const sagra = await prisma.sagra.update({
            where: { id: this.getSagraId() },
            data: { receiptLogo: null },
            select: settingsSelect
        });

        if (oldLogo) SettingService.imageService.delete(oldLogo);

        this.cache = this.toResponse(sagra);
        return this.cache;
    }
}

export const settingService = SettingService.getInstance();
