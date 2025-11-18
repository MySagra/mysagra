import z from "zod"

export const userSchema = z.object({
    username: z.string().min(4),
    password: z.string().min(8),
    roleId: z.string().cuid()
})

export type User = z.infer<typeof userSchema>