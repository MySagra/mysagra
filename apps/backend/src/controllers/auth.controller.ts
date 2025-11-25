import { Response } from "express";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/utils/asyncHandler";
import { env } from "@/config/env";
import { Login } from "@/schemas/auth";
import { TypedRequest } from "@/types/request";

export class AuthController {
    constructor(private authService: AuthService) { }

    login = asyncHandler(async (
        req: TypedRequest<{body: Login}>, 
        res: Response, 
    ): Promise<void> => {
        const { username, password } = req.validated.body;
        const user = await this.authService.getUser(username);

        if(!user){
            res.status(404).json({
                message: "User not exist"
            })
            return;
        }

        const tokens = await this.authService.login(user, password, req.ip, req.get('User-Agent'));

        if(!tokens){
            res.status(401).json({
                message: "Invalid Credentials"
            });
            return;
        }

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role.name
            },
            accessToken: tokens.accessToken
        });
    });
    
    logout = asyncHandler(async (
        req: TypedRequest<{}>, 
        res: Response, 
    ): Promise<void> => {
        const { refreshToken } = req.cookies;
        this.authService.logout(refreshToken);

        res.clearCookie('refreshToken', {
            path: '/',
            sameSite: 'lax',
            secure: env.NODE_ENV === 'production'
        });
        res.status(200).json({ message: "Logged out successfully" });
    });

    refresh = asyncHandler(async (
        req: TypedRequest<{}>, 
        res: Response, 
    ): Promise<void> => {
        const { refreshToken } = req.cookies;
        const accessToken = await this.authService.refresh(refreshToken)
        if(!accessToken) {
            res.status(401).json({ message: "Refresh token not valid" });
            return;
        }
        
        res.status(200).json({ accessToken });
    });
}