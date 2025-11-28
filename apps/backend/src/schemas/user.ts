import z from "zod"

import { RoleResponseSchema} from "@/schemas/role";

export const UserBase = {
    username: z.string().min(4),
    roleId: z.string().cuid()
}


export const CreateUserSchema = z.object({
    ...UserBase,
    password: z.string()
})

export const UpdateUserSchema = z.object({
    ...UserBase,
    password: z.string()
})

export const UserResponseSchema = z.object({
    id: z.string().cuid(),
    ...UserBase,
    role: RoleResponseSchema,
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>