import 'zod-openapi'
import { z } from 'zod'

export const RoleEnum = z.enum(["guest", "admin", "operator"]).meta({
    id: "Role",
    description: "User role",
    example: "operator"
})

const RoleBase = {
    name: RoleEnum
}

export const CreateRoleSchema = z.object({
    ...RoleBase,
}).meta({
    id: "CreateRoleRequest",
    description: "Payload required to create a new role"
})

export const RoleResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the role"
    }),
    ...RoleBase,
}).meta({
    id: "RoleResponse",
    description: "Role entity with identifier"
})

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>
export type  RoleResponse = z.infer<typeof RoleResponseSchema>