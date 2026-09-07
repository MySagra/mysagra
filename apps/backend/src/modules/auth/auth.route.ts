import { z } from "zod";
import { createModule, route } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { authLimiter } from "@/middlewares/rateLimiter.middleware";
import { env } from "@/config/env";
import { SESSION_COOKIE } from "@/common/constants";
import { UnauthorizedError } from "@/common/errors";
import { AuthService } from "@/modules/auth/auth.service";
import { LoginSchema, LoginResponseSchema, RevokeSessionParamsSchema } from "@mysagra/schemas";

const service = new AuthService();

const ErrorResponseSchema = z.object({
    message: z.string().meta({ description: "Human-readable error description", example: "Unauthorized" }),
}).meta({ id: "ErrorResponse", description: "Standard error response" });

const SessionItemSchema = z.object({
    sessionId: z.string().meta({ description: "Unique session identifier", example: "a3f2c1..." }),
    userAgent: z.string().nullable().meta({ description: "User-Agent of the client that created the session" }),
    expiresAt: z.string().meta({ description: "Session expiry timestamp (ISO 8601)" }),
    createdAt: z.string().meta({ description: "Session creation timestamp (ISO 8601)" }),
    revokedAt: z.string().nullable().meta({ description: "Revocation timestamp, null if session still active" }),
}).meta({ id: "SessionItem", description: "A single session record" });

export const authModule = createModule({
    basePath: "/auth",
    tags: ["Auth"],
    limiter: authLimiter,
    routes: [
        route({
            method: "post",
            path: "/login",
            summary: "Authenticate user",
            description:
                "Authenticates a user with username and password. Returns the session payload. " +
                "The session identifier is set as an HTTP-only `mysagra_session` cookie, " +
                "which expires at 07:00 the following morning.",
            body: LoginSchema,
            responses: {
                200: { description: "Authentication successful. Session set via HTTP-only cookie.", schema: LoginResponseSchema },
                400: { description: "Bad request — missing or invalid fields", schema: ErrorResponseSchema },
                401: { description: "Unauthorized — Invalid credentials", schema: ErrorResponseSchema },
                404: { description: "Not Found — User not found", schema: ErrorResponseSchema },
                429: { description: "Too Many Requests — Too many login attempts", schema: ErrorResponseSchema },
            },
            handler: async (req, res) => {
                const { username, password } = req.validated.body;
                const { sessionPayload, sessionId, expiresAt } = await service.login(
                    username,
                    password,
                    req.headers["user-agent"],
                );

                res.cookie(SESSION_COOKIE, sessionId, {
                    httpOnly: true,
                    secure: env.NODE_ENV === "production",
                    sameSite: "lax",
                    path: "/",
                    expires: expiresAt,
                });

                res.status(200).json(sessionPayload);
            },
        }),
        route({
            method: "post",
            path: "/logout",
            summary: "Logout user",
            description:
                "Terminates the current session. The session identifier is read automatically " +
                "from the `mysagra_session` HTTP-only cookie.",
            security: [{ cookieAuth: [] }],
            responses: {
                200: { description: "Session terminated" },
                401: { description: "Unauthorized — invalid or expired session", schema: ErrorResponseSchema },
            },
            handler: async (req, res) => {
                const session = req.cookies.mysagra_session;

                res.clearCookie(SESSION_COOKIE, {
                    path: "/",
                    sameSite: "lax",
                    secure: env.NODE_ENV === "production",
                    httpOnly: true,
                });

                if (session) {
                    await service.logout(session);
                }

                res.status(200).json({ message: "Logged out successfully" });
            },
        }),
        route({
            method: "get",
            path: "/sessions",
            summary: "List user sessions",
            description:
                "Returns all sessions for the authenticated user, ordered by creation date (newest first). " +
                "Includes both active and revoked sessions. Requires role: `admin`, `maintainer`, or `operator`.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            responses: {
                200: { description: "Sessions retrieved successfully", schema: z.array(SessionItemSchema) },
                401: { description: "Unauthorized — missing or invalid session cookie", schema: ErrorResponseSchema },
                403: { description: "Forbidden — insufficient role", schema: ErrorResponseSchema },
            },
            handler: async (req, res) => {
                if (!req.user) throw new UnauthorizedError("Not authorized");
                res.status(200).json(await service.getSessions(req.user.userId));
            },
        }),
        route({
            method: "delete",
            path: "/session/{sessionId}",
            summary: "Revoke a session",
            description:
                "Revokes the specified session by ID. Users can only revoke their own sessions. " +
                "Requires role: `admin`, `maintainer`, or `operator`.",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: RevokeSessionParamsSchema,
            responses: {
                204: { description: "Session revoked successfully" },
                401: { description: "Unauthorized — missing/invalid session cookie", schema: ErrorResponseSchema },
                403: { description: "Forbidden — insufficient role", schema: ErrorResponseSchema },
                404: { description: "Not Found — session not found or already expired", schema: ErrorResponseSchema },
            },
            handler: async (req, res) => {
                if (!req.user) throw new UnauthorizedError("Not authorized");
                await service.revokeSession(req.user.userId, req.validated.params.sessionId);
                res.status(204).send();
            },
        }),
    ],
});
