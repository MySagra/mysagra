import { z } from "zod"
import { RoleEnum } from "./role.schema"

export const SessionPayloadSchema = z.object({
    userId: z.cuid(),
    username: z.string(),
    role: RoleEnum
})

export const RevokeSessionParamsSchema = z.object({
    sessionId: z.string().length(64)
})

export type SessionPayload = z.infer<typeof SessionPayloadSchema>
export type RevokeSessionParams = z.infer<typeof RevokeSessionParamsSchema>