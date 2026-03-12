import { z } from "zod";
import { registry } from "@/config/swagger";
import { LoginSchema, LoginResponseSchema } from "@mysagra/schemas";

// ─── Security schemes ───────────────────────────────────────────────────────

registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "refreshToken",
    description: "HTTP-only token cookie set automatically on login",
});

// ─── Schemas ────────────────────────────────────────────────────────────────

const LoginRequestSchema = registry.register("LoginRequest", LoginSchema);
const LoginResponse = registry.register("LoginResponse", LoginResponseSchema);

const ErrorResponseSchema = registry.register(
    "ErrorResponse",
    z.object({
        message: z.string().meta({
            description: "Human-readable error description",
            example: "Unauthorized",
        }),
    }).meta({
        id: "ErrorResponse",
        description: "Standard error response",
    })
);

// ─── Routes ─────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "post",
    path: "/auth/login",
    summary: "Authenticate user",
    description:
        "Authenticate a user with username and password. Returns user info. A short-lived token is set as an HTTP-only cookie named `mysagra_token` (6 hours).",
    tags: ["Auth"],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: LoginRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description:
                "Authentication successful. Access token returned in body; refresh token set as HTTP-only cookie.",
            headers: {
                "Set-Cookie": {
                    description: "HTTP-only refresh token cookie (Max-Age=604800)",
                    schema: {
                        type: "string",
                        example:
                            "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/",
                    },
                },
            },
            content: {
                "application/json": {
                    schema: LoginResponse,
                },
            },
        },
        400: {
            description: "Bad request — missing or invalid fields",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        401: {
            description: "Unauthorized — invalid password",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        404: {
            description: "User not found",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});


registry.registerPath({
    method: "post",
    path: "/auth/logout",
    summary: "Logout user",
    description:
        "Revoke the refresh token to terminate the current session. The token is read automatically from the `refreshToken` HTTP-only cookie.",
    tags: ["Auth"],
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "Session terminated — refresh token revoked",
        },
        400: {
            description: "Bad request — refresh token missing or malformed",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        401: {
            description: "Unauthorized — invalid or expired refresh token",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});

/*
registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    summary: "Refresh access token",
    description:
        "Exchange the refresh token (read from the `refreshToken` HTTP-only cookie) for a new short-lived access token.",
    tags: ["Auth"],
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "New access token generated successfully",
            content: {
                "application/json": {
                    schema: RefreshResponseSchema,
                },
            },
        },
        400: {
            description: "Bad request — refresh token missing",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        401: {
            description: "Unauthorized — refresh token invalid or expired",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
    },
});
*/