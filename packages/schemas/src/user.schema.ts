import 'zod-openapi'
import { z } from 'zod'
import { RoleResponseSchema } from './role.schema'

export const UserBase = {
    username: z.string().min(4).meta({
        description: "Username for the user account",
        example: "john_doe"
    }),
    roleId: z.cuid().meta({
        description: "Unique identifier of the assigned role"
    })
}

export const CreateUserSchema = z.object({
    ...UserBase,
    password: z.string().meta({
        description: "User's password",
        example: "Super_secret_password!"
    })
}).meta({
    id: "CreateUserRequest",
    description: "Payload required to create a new user"
})

export const UpdateUserSchema = z.object({
    ...UserBase,
    password: z.string().meta({
        description: "User's password",
        example: "Super_secret_password!"
    })
}).meta({
    id: "UpdateUserRequest",
    description: "Payload required to update a user"
})

export const UserResponseSchema = z.object({
    id: z.cuid().meta({
        description: "Unique identifier for the user"
    }),
    ...UserBase,
    role: RoleResponseSchema
}).meta({
    id: "UserResponse",
    description: "User entity with role information"
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>