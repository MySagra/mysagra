import z from "zod"

export const loginSchema = z.object({
    username: z.string(),
    password: z.string()
})

export const refreshSchema = z.object({
    refreshToken: z.string()
})

const roleSchema = z.enum(["guest","admin", "operator"])

export const tokenPaylaodSchema = z.object({
    sub: z.number(),
    username: z.string(),
    role: roleSchema,
    iat: z.number()
})

export type TokenPayload = z.infer<typeof tokenPaylaodSchema>
export type Role = z.infer<typeof roleSchema>