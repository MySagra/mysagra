import { Request, Response, NextFunction } from "express"
import { TokenService } from "@/modules/auth/token.service";
import { TokenPayload } from "@mysagra/schemas";

const tokenService = new TokenService();

export function extractUser() {
    return (req: Request, res: Response, next: NextFunction) => {
        const cookie = req.cookies.mysagra_token;
        const payload = tokenService.getTokenPayload(cookie);

        if (payload) {
            req.user = payload
            next();
            return;
        }

        req.user = {
            sub: "0",
            username: "guest",
            role: "guest",
            iat: 0
        };
        next()
        return;
    }
}