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
        "Authenticate a user with username and password. Returns user info. A short-lived token is set as an HTTP-only cookie named `mysagra_session` (6 hours).",
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
            description: "Unauthorized — Invalid credentials (user not found or invalid password)",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        404: {
            description: "Not Found — User not found",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        429: {
            description: "Too Many Requests — Too many login attempts, please try again later",
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

const SessionItemSchema = registry.register(
    "SessionItem",
    z.object({
        sessionId: z.string().meta({ description: "Unique session identifier", example: "a3f2c1..." }),
        userAgent: z.string().nullable().meta({ description: "User-Agent of the client that created the session", example: "Mozilla/5.0 ..." }),
        expiresAt: z.string().datetime().meta({ description: "Session expiry timestamp (ISO 8601)", example: "2026-05-28T18:00:00.000Z" }),
        createdAt: z.string().datetime().meta({ description: "Session creation timestamp (ISO 8601)", example: "2026-05-28T12:00:00.000Z" }),
        revokedAt: z.string().datetime().nullable().meta({ description: "Revocation timestamp, null if session still active", example: null }),
    }).meta({
        id: "SessionItem",
        description: "A single session record",
    })
);

registry.registerPath({
    method: "get",
    path: "/auth/sessions",
    summary: "List user sessions",
    description:
        "Returns all sessions for the authenticated user, ordered by creation date (newest first). Includes both active and revoked sessions. Requires role: `admin`, `maintainer`, or `operator`.",
    tags: ["Auth"],
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "Sessions retrieved successfully",
            content: {
                "application/json": {
                    schema: z.array(SessionItemSchema),
                },
            },
        },
        401: {
            description: "Unauthorized — missing or invalid session cookie",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Forbidden — insufficient role",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        404: {
            description: "Not Found — user not found",
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
    method: "delete",
    path: "/auth/session/{sessionId}",
    summary: "Revoke a session",
    description:
        "Revokes the specified session by ID. Users can only revoke their own sessions. Requires role: `admin`, `maintainer`, or `operator`.",
    tags: ["Auth"],
    security: [{ cookieAuth: [] }],
    request: {
        params: z.object({
            sessionId: z.string().length(64).meta({ description: "64-character hex session ID", example: "a3f2c1d0e9b8a7f6..." }),
        }),
    },
    responses: {
        200: {
            description: "Session revoked successfully",
        },
        401: {
            description: "Unauthorized — missing/invalid session cookie, or attempting to revoke another user's session",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        403: {
            description: "Forbidden — insufficient role",
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
        },
        404: {
            description: "Not Found — session not found or already expired",
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