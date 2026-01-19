import z from "zod";
import { registry } from "../registry";

const RoleBaseSchema = z.object({
    name: z.string().min(1).max(100).describe("Name of the role")
})

export const CreateRoleRequestSchema = z.object({
    ...RoleBaseSchema.shape,
}).openapi("CreateRoleRequest", {
    description: "Request body for creating a new role",
    example: {
        name: "operator"
    }
})

export const RoleResponseSchema = z.object({
    id: z.cuid().describe("Unique identifier of the role"),
    ...RoleBaseSchema.shape,
}).openapi("RoleResponse", {
    description: "Role data returned from the API",
    example: {
        id: "clh1234567890abcdef",
        name: "operator"
    }
})

export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>
export type RoleResponse = z.infer<typeof RoleResponseSchema>

registry.register("CreateRoleRequest", CreateRoleRequestSchema)
registry.register("RoleResponse", RoleResponseSchema)