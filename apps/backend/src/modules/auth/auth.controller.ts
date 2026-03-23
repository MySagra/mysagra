import { Response } from "express";
import { AuthService } from "@/modules/auth/auth.service";
import { asyncHandler } from "@/utils/asyncHandler";
import { env } from "@/config/env";
import { LoginRequest } from "@mysagra/schemas";
import { TypedRequest } from "@/types/request";

export class AuthController {
    constructor(private authService: AuthService) { }

    login = asyncHandler(async (
        req: TypedRequest<{ body: LoginRequest }>,
        res: Response,
    ): Promise<void> => {
        const { username, password } = req.validated.body;
        const user = await this.authService.getUser(username);

        if (!user) {
            res.status(401).json({
                message: "Invalid Credentials"
            })
            return;
        }

        const token = await this.authService.login(user, password);

        if (!token) {
            res.status(401).json({
                message: "Invalid Credentials"
            });
            return;
        }

        res.cookie('mysagra_token', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 6 * 60 * 60 * 1000
        });

        res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role.name
        });
    });

    logout = asyncHandler(async (
        req: TypedRequest<{}>,
        res: Response,
    ): Promise<void> => {
        const token = req.cookies.mysagra_token;

        res.clearCookie('mysagra_token', {
            path: '/',
            sameSite: 'lax',
            secure: env.NODE_ENV === 'production',
            httpOnly: true
        });

        await this.authService.logout(token);
        res.status(200).json({ message: "Logged out successfully" });
    });
}