import z from "zod";

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