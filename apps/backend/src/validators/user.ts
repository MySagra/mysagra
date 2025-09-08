import z from "zod"
import { idSchema } from "./params"

export const userSchema = z.object({
    username: z.string().min(4),
    password: z.string().min(8),
    roleId: idSchema
})