import z from "zod";

const UserBase = {
    name: z.string().min(1)
}


export const CreateRoleSchema = z.object({
    ...UserBase,
})

export const RoleResponseSchema = z.object({
    id: z.string().cuid(),
    ...UserBase,
})

export type CreateRoleResponse = z.infer<typeof CreateRoleSchema>
export type  RoleResponse = z.infer<typeof RoleResponseSchema>