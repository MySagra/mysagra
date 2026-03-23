import { z } from "zod";

export const ApiKeyTypeSchema = z.enum(["PRINTER", "WEBAPP"]);
export const ApiKeyPrefixSchema = z.enum(["ms_pt_", "ms_wb_"])

export const ApiKeyBaseResponseSchema = z.object({
    id: z.cuid(),
    last_digits: z.string().length(4),
    type: ApiKeyTypeSchema,
    prefix: ApiKeyPrefixSchema,

    name: z.string(),
    createdAt: z.coerce.date(),
    lastUsedAt: z.coerce.date().nullable(),
    revokedAt: z.coerce.date().nullable()
})

export const CreateApiKeyResponseSchema = z.object({
    id: z.cuid(),
    type: ApiKeyTypeSchema,
    apiKey: z.string(),
    createdAt: z.coerce.date()
})

export const CreateApiKeySchema = z.object({
    name: z.string(),
    type: ApiKeyTypeSchema
})

export type ApiKeyResponse = z.infer<typeof ApiKeyBaseResponseSchema>
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>
export type ApiKeyType = z.infer<typeof ApiKeyTypeSchema>
export type ApiKeyPrefix = z.infer<typeof ApiKeyPrefixSchema>