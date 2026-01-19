import z from "zod"

import { RoleResponseSchema } from "./role";
import { registry } from "../registry";

const UserBaseSchema = z.object({
    username: z.string().min(4).max(100).describe("Username for the user account"),
    roleId: z.cuid().describe("ID of the role assigned to this user")
})

export const CreateUserRequestSchema = z.object({
    ...UserBaseSchema.shape,
    password: z.string().describe("Password for the user account")
}).openapi("CreateUserRequest", {
    description: "Request body for creating a new user",
    example: {
        username: "johndoe",
        password: "securepassword123",
        roleId: "clh1234567890abcdef"
    }
})

export const UpdateUserRequestSchema = z.object({
    ...UserBaseSchema.shape,
    password: z.string().describe("New password for the user account")
}).openapi("UpdateUserRequest", {
    description: "Request body for updating a user",
    example: {
        username: "johndoe_updated",
        password: "newsecurepassword123",
        roleId: "clh1234567890abcdef"
    }
})

export const UserResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the user"),
    ...UserBaseSchema.shape,
    role: RoleResponseSchema.describe("Role assigned to this user"),
}).openapi("UserResponse", {
    description: "User data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        username: "johndoe",
        roleId: "clh0987654321fedcba",
        role: {
            id: "clh0987654321fedcba",
            name: "operator"
        }
    }
})

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>

registry.register("CreateUserRequest", CreateUserRequestSchema)
registry.register("UpdateUserRequest", UpdateUserRequestSchema)
registry.register("UserResponse", UserResponseSchema)