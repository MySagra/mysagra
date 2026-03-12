
import { z } from 'zod'
import { RoleEnum } from './role.schema'

export const LoginSchema = z.object({
    username: z.string().meta({
        description: "Your username",
        example: "John_Doe"
    }),
    password: z.string().meta({
        description: "Your password",
        example: "Super_secret_password!"
    })
}).meta({
    id: "LoginRequest",
    description: "Payload required to authenticate a user"
})

export const RefreshSchema = z.object({
    refreshToken: z.jwt().meta({
        description: "JWT refresh token",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    })
}).meta({
    id: "RefreshRequest",
    description: "Payload required to refresh an access token"
})

export const TokenPayloadSchema = z.object({
    sub: z.string().meta({ description: "Subject — the user's unique identifier" }),
    username: z.string().meta({ description: "The user's username" }),
    role: RoleEnum,
    iat: z.number().meta({ description: "Issued-at timestamp (Unix epoch seconds)" })
}).meta({
    id: "TokenPayload",
    description: "Decoded JWT access-token payload"
})

export const LoginResponseSchema = z.object({
    user: z.object({
        id: z.cuid().meta({
            description: "User id"
        }),
        username: z.string().meta({
            description: "User role",
            example: "admin"
        }),
        role: RoleEnum
    }),
    accessToken: z.jwt().meta({
        description: "JWT for access token"
    })
})

// Inferred types
export type LoginRequest = z.infer<typeof LoginSchema>
export type RefreshRequest = z.infer<typeof RefreshSchema>
export type TokenPayload = z.infer<typeof TokenPayloadSchema>