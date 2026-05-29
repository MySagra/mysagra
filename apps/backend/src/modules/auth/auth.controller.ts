import { Response } from "express";
import { AuthService } from "@/modules/auth/auth.service";
import { asyncHandler } from "@/utils/asyncHandler";
import { env } from "@/config/env";
import { LoginRequest, RevokeSessionParams } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";
import { UnauthorizedError } from "@/common/errors";

export class AuthController {
    constructor(private authService: AuthService) { }

    login = asyncHandler(async (
        req: TypedRequest<{ body: LoginRequest }>,
        res: Response,
    ): Promise<void> => {
        const { username, password } = req.validated.body;
        const { sessionPayload, sessionId, expiresAt } = await this.authService.login(username, password, req.headers["user-agent"]);

        res.cookie('mysagra_session', sessionId, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: expiresAt
        });

        res.status(200).json(sessionPayload);
    });

    logout = asyncHandler(async (
        req: TypedRequest<{}>,
        res: Response,
    ): Promise<void> => {
        const session = req.cookies.mysagra_session;

        res.clearCookie('mysagra_session', {
            path: '/',
            sameSite: 'lax',
            secure: env.NODE_ENV === 'production',
            httpOnly: true
        });

        if (session) {
            await this.authService.logout(session);
        }

        res.status(200).json({ message: "Logged out successfully" });
    });

    getSessions = asyncHandler(async (
        req: TypedRequest<{}>,
        res: Response,
    ): Promise<void> => {
        if(!req.user) throw new UnauthorizedError("Not authorized");

        const userId = req.user.userId;
        const sessions = await this.authService.getSessions(userId);

        res.status(200).json(sessions);
    });

    revokeSession = asyncHandler(async (
        req: TypedRequest<{ params: RevokeSessionParams }>,
        res: Response,
    ): Promise<void> => {
        if(!req.user) throw new UnauthorizedError("Not authorized");

        const userId = req.user.userId
        const { sessionId } = req.validated.params
        
        await this.authService.revokeSession(userId, sessionId);

        res.status(204).json();
    });
}