import z from "zod"

export const LoginSchema = z.object({
    username: z.string(),
    password: z.string()
})

export const RefreshSchema = z.object({
    refreshToken: z.string()
})

const RoleEnum = z.enum(["guest","admin", "operator"])

export const TokenPayloadSchema = z.object({
    sub: z.string(),
    username: z.string(),
    role: RoleEnum,
    iat: z.number()
})

export type TokenPayload = z.infer<typeof TokenPayloadSchema>
export type UserRole = z.infer<typeof RoleEnum>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshInput = z.infer<typeof RefreshSchema>