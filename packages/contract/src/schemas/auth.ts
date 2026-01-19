import z from "zod"
import { registry } from "../registry"

export const LoginRequestSchema = z.object({
    username: z.string().describe("The username of the user"),
    password: z.string().describe("The password of the user")
}).openapi('LoginRequest', {
    description: "Request body for user login",
    example: {
        username: "admin",
        password: "secretpassword"
    }
})

export const RefreshRequestSchema = z.object({
    refreshToken: z.string().describe("The refresh token to obtain a new access token")
}).openapi('RefreshRequest', {
    description: "Request body for token refresh",
    example: {
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
})

const RoleEnumSchema = z.enum(["guest", "admin", "operator"]).describe("User role in the system").openapi("UserRole")

export const TokenPayloadSchema = z.object({
    sub: z.string().describe("Subject - the user ID"),
    username: z.string().describe("The username of the authenticated user"),
    role: RoleEnumSchema.describe("The role of the authenticated user"),
    iat: z.number().describe("Issued at timestamp")
}).openapi('TokenPayload', {
    description: "JWT token payload structure"
})

export const LoginResponseSchema = z.object({
    user: z.object({
        id: z.cuid().describe("The unique identifier of the user"),
        username: z.string().describe("The username of the user"),
        role: RoleEnumSchema.describe("The role of the user")
    }).describe("User information"),
    accessToken: z.jwt().describe("JWT access token for authentication")
}).openapi('LoginResponse', {
    description: "Response body after successful login",
    example: {
        user: {
            id: "clh1234567890abcdef",
            username: "admin",
            role: "admin"
        },
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
})

export type TokenPayload = z.infer<typeof TokenPayloadSchema>
export type UserRole = z.infer<typeof RoleEnumSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>

registry.register("LoginRequest", LoginRequestSchema)
registry.register("RefreshRequest", RefreshRequestSchema)
