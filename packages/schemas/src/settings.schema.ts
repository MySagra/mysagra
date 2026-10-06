import { z } from "zod";
import { SagraNameSchema } from "./sagra.schema";

export const FieldModeSchema = z.enum(["HIDDEN", "OPTIONAL", "REQUIRED"]).meta({
    id: "FieldMode",
    description: "HIDDEN: field not shown, OPTIONAL: cashier may fill it, REQUIRED: order can't be sent without it"
})

export const TableInputSchema = z.enum(["NUMBER", "TEXT"]).meta({
    id: "TableInput",
    description: "NUMBER: table number from 1 to maxTables, TEXT: free text (e.g. 'Bancone', 'Giardino 3')"
})

export const OrderingModeSchema = z.enum(["OPEN", "CLOSED", "SCHEDULE"]).meta({
    id: "OrderingMode",
    description: "Ordering from the customer webapp only (cash desks are not affected). " +
        "OPEN: always accepts orders, CLOSED: never (e.g. the kitchen is full), SCHEDULE: only between opensAt and closesAt"
})

// "HH:mm", 24h
const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time in HH:mm format")

// IANA time zone name, checked against the runtime time zone database
const TimeZoneSchema = z.string().refine((tz) => {
    try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}, "Unknown time zone")

// ISO 4217 code, checked against the currencies known to the runtime
const CurrencySchema = z.string().refine(
    (code) => Intl.supportedValuesOf("currency").includes(code),
    "Unknown currency, expected an ISO 4217 code (e.g. EUR)"
)

// Full example: OpenAPI would otherwise show the `{}` prefault of each group as its example
const SETTINGS_EXAMPLE = {
    general: {
        timezone: "Europe/Rome",
        currency: "EUR",
    },
    orders: {
        customer: "OPTIONAL",
        table: "REQUIRED",
        tableInputs: ["NUMBER", "TEXT"],
        maxTables: 50,
    },
    tickets: {
        showNumbers: true,
    },
    ordering: {
        mode: "SCHEDULE",
        opensAt: "18:30",
        closesAt: "01:00",
    },
}

// Stored as a single JSON document (settings.data): every field has a default, so documents
// saved by older versions are completed when parsed.
// Grouped by feature, not by app: a rule can be used by several apps (e.g. `orders` by the cash desk,
// the customer webapp and the backend), each app reads the groups it needs.
export const SettingsDataSchema = z.object({
    general: z.object({
        timezone: TimeZoneSchema.default("Europe/Rome").meta({
            description: "IANA time zone used by every time-based rule (e.g. ordering hours). Default: Europe/Rome"
        }),
        currency: CurrencySchema.default("EUR").meta({
            description: "ISO 4217 currency of every price, used to format amounts in the apps and on receipts. " +
                "Changing it doesn't convert the stored prices. Default: EUR"
        }),
    }).prefault({}).meta({
        description: "Settings shared by every feature",
        example: SETTINGS_EXAMPLE.general
    }),
    orders: z.object({
        customer: FieldModeSchema.default("OPTIONAL").meta({
            description: "Customer name field at the cash desk. Default: OPTIONAL"
        }),
        table: FieldModeSchema.default("OPTIONAL").meta({
            description: "Table field at the cash desk. Default: OPTIONAL"
        }),
        tableInputs: z.array(TableInputSchema).min(1).default(["NUMBER", "TEXT"]).meta({
            description: "How the table can be written, at least one. Ignored when `table` is HIDDEN. Default: both"
        }),
        maxTables: z.number().int().positive().nullable().default(null).meta({
            description: "Highest table number, used only with the NUMBER input. null means no limit. Default: null"
        }),
    }).prefault({}).meta({
        description: "Fields the cashier fills besides the dishes",
        example: SETTINGS_EXAMPLE.orders
    }),
    tickets: z.object({
        showNumbers: z.boolean().default(false).meta({
            description: "What identifies an order on screens and prints. false: the display code (e.g. K7Q), " +
                "which doesn't show the order of arrival, so nobody claims to be served first. true: the progressive " +
                "ticket number (e.g. 42), easier to call out but it shows who ordered first. " +
                "Every confirmed order gets both. Default: false"
        }),
    }).prefault({}).meta({
        description: "How orders are identified in the apps and on receipts",
        example: SETTINGS_EXAMPLE.tickets
    }),
    ordering: z.object({
        mode: OrderingModeSchema.default("OPEN").meta({
            description: "When the customer webapp accepts orders. Cash desks can always create orders. Default: OPEN"
        }),
        opensAt: TimeOfDaySchema.default("18:00").meta({
            description: "Opening time (HH:mm, in `general.timezone`), used with SCHEDULE. Default: 18:00"
        }),
        closesAt: TimeOfDaySchema.default("23:00").meta({
            description: "Closing time (HH:mm). Earlier than opensAt means it closes after midnight (e.g. 19:00-01:00). Default: 23:00"
        }),
    }).prefault({}).refine((o) => o.opensAt !== o.closesAt, {
        message: "Opening and closing time must be different",
        path: ["closesAt"],
    }).meta({
        description: "Ordering hours of the customer webapp (myclienti). Cash desks are not affected",
        example: SETTINGS_EXAMPLE.ordering
    }),
}).meta({
    id: "SettingsData",
    description: "Sagra settings. Every field is optional: missing ones are filled with their defaults",
    example: SETTINGS_EXAMPLE
})

// The settings page edits the sagra name too: one resource for the client, two tables in the DB
const SettingsSagraSchema = z.object({
    name: SagraNameSchema
})

// read only: the logo is uploaded with its own endpoint, a settings PUT never changes it
const SettingsSagraResponseSchema = SettingsSagraSchema.extend({
    receiptLogo: z.string().nullable().meta({
        description: "Path of the black and white logo printed on receipts, relative to the API base URL " +
            "(e.g. /uploads/receipt_logo/receipt-logo-1730000000000.png). null when no logo was uploaded",
        example: "/uploads/receipt_logo/receipt-logo-1730000000000.png"
    })
})

export const UpdateSettingsSchema = z.object({
    sagra: SettingsSagraSchema,
    settings: SettingsDataSchema
}).meta({
    id: "UpdateSettingsRequest",
    description: "Replaces the whole settings document and the sagra data shown in the settings page"
})

export const SettingsResponseSchema = z.object({
    sagra: SettingsSagraResponseSchema,
    settings: SettingsDataSchema,
    updatedAt: z.date().nullable().meta({
        description: "Last settings change, null when they were never saved (defaults in use)"
    })
}).meta({
    id: "SettingsResponse",
    description: "Sagra settings with the defaults applied"
})

export type FieldMode = z.infer<typeof FieldModeSchema>;
export type OrderingMode = z.infer<typeof OrderingModeSchema>;
export type TableInput = z.infer<typeof TableInputSchema>;
export type SettingsData = z.infer<typeof SettingsDataSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
