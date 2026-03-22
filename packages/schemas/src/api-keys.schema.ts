import { z } from "zod";

export const APIKeyType = z.enum(["PRINTER", "WEBAPP"]);
export const ApiKeyPrefix = z.enum(["ms_pt_", "ms_wb_"])

export const ApiKeyBaseResponseSchema = z.object({
    id: z.cuid(),
    last_digits: z.string().length(4),
    type: APIKeyType,
    prefix: ApiKeyPrefix,

    name: z.string(),
    createdAt: z.date(),
    lastUsedAt: z.date().nullable(),
    revokedAt: z.date().nullable()
})

export const CreateApiKeyResponseSchema = z.object({
    id: z.cuid(),
    type: APIKeyType,
    apiKey: z.string(),
    createdAt: z.date()
})

export const CreateApiKeySchema = z.object({
    name: z.string(),
    type: APIKeyType
})

export type ApiKeyResponse = z.infer<typeof ApiKeyBaseResponseSchema>
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>