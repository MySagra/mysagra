import z from "zod";
import { CreateUserSchema } from "./user.schema";
import { SagraNameSchema, SagraSchema } from "./sagra.schema";
import { SettingsDataSchema } from "./settings.schema";

export const CreateSetupSchema = z.object({
    token: z.string().min(1).meta({
        description: "Setup token printed in the backend logs at startup (or the SETUP_TOKEN env variable)",
        example: "a375ea55d8b5440884408353b3738307"
    }),
    sagra: z.object({
        name: SagraNameSchema
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