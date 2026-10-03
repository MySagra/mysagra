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

// Full example: OpenAPI would otherwise show the `{}` prefault of `orders` as its example
const SETTINGS_EXAMPLE = {
    orders: {
        customer: "OPTIONAL",
        table: "REQUIRED",
        tableInputs: ["NUMBER", "TEXT"],
        maxTables: 50,
    },
    showTicketNumbers: true,
}

// Stored as a single JSON document (settings.data): every field has a default, so documents
// saved by older versions are completed when parsed
export const SettingsDataSchema = z.object({
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
    showTicketNumbers: z.boolean().default(false).meta({
        description: "Give every order a progressive ticket number to call at pickup. Default: false"
    })
}).meta({
    id: "SettingsData",
    description: "Sagra settings. Every field is optional: missing ones are filled with their defaults",
    example: SETTINGS_EXAMPLE
})

// The settings page edits the sagra name too: one resource for the client, two tables in the DB
const SettingsSagraSchema = z.object({
    name: SagraNameSchema
})

export const UpdateSettingsSchema = z.object({
    sagra: SettingsSagraSchema,
    settings: SettingsDataSchema
}).meta({
    id: "UpdateSettingsRequest",
    description: "Replaces the whole settings document and the sagra data shown in the settings page"
})

export const SettingsResponseSchema = z.object({
    sagra: SettingsSagraSchema,
    settings: SettingsDataSchema,
    updatedAt: z.date().nullable().meta({
        description: "Last settings change, null when they were never saved (defaults in use)"
    })
}).meta({
    id: "SettingsResponse",
    description: "Sagra settings with the defaults applied"
})

export type FieldMode = z.infer<typeof FieldModeSchema>;
export type TableInput = z.infer<typeof TableInputSchema>;
export type SettingsData = z.infer<typeof SettingsDataSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
