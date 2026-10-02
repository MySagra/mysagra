import z from "zod";
import { CreateUserSchema } from "./user.schema";
import { SagraSchema } from "./sagra.schema";

export const FieldModeSchema = z.enum(["HIDDEN", "OPTIONAL", "REQUIRED"]).meta({
    description: "HIDDEN: field not shown, OPTIONAL: cashier may fill it, REQUIRED: order can't be sent without it"
})

export const TableInputSchema = z.enum(["NUMBER", "TEXT"]).meta({
    description: "NUMBER: table number from 1 to maxTables, TEXT: free text (e.g. 'Bancone', 'Giardino 3')"
})

export const SettingsDataSchema = z.object({
    orders: z.object({
        customer: FieldModeSchema.default("OPTIONAL"),
        table: FieldModeSchema.default("OPTIONAL"),
        tableInputs: z.array(TableInputSchema).min(1).default(["NUMBER", "TEXT"]),
        maxTables: z.number().int().positive().nullable().default(null),
    }).prefault({}),
    showTicketNumbers: z.boolean().default(false)
})

export const CreateSetupSchema = z.object({
    token: z.string().min(1).meta({
        description: "Setup token printed in the backend logs at startup (or the SETUP_TOKEN env variable)"
    }),
    sagra: z.object({
        name: z.string().trim().min(1).max(100)
    }),
    user: CreateUserSchema.omit({ roleId: true }),
    settings: SettingsDataSchema.prefault({}),
}).meta({
    id: "CreateSetupRequest",
    description: "Initial configuration: creates the sagra, its settings and the first admin"
})

export const SetupStatusResponseSchema = z.object({
    required: z.boolean().meta({
        description: "true when the system has no users and the initial setup must be done"
    })
}).meta({
    id: "SetupStatusResponse",
    description: "Whether the initial setup is still required"
})

export const SetupResponseSchema = z.object({
    sagra: SagraSchema,
    settings: SettingsDataSchema
}).meta({
    id: "SetupResponse",
    description: "Created sagra and its settings (defaults applied). The admin logs in with the chosen credentials"
})

export type CreateSetup = z.infer<typeof CreateSetupSchema>;
export type SetupStatusResponse = z.infer<typeof SetupStatusResponseSchema>;
export type SetupResponse = z.infer<typeof SetupResponseSchema>;
export type SettingsData = z.infer<typeof SettingsDataSchema>;