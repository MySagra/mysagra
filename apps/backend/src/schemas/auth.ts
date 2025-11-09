import z from "zod"

export const loginSchema = z.object({
    username: z.string(),
    password: z.string()
})

export const refreshSchema = z.object({
    refreshToken: z.string()
})

export const tokenPaylaodSchema = z.object({
    sub: z.number(),
    username: z.string(),
    role: z.string(),
    iat: z.number()
})

export type TokenPayload = z.infer<typeof tokenPaylaodSchema>