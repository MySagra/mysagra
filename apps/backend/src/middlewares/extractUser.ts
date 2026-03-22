import { Request, Response, NextFunction } from "express"
import { TokenService } from "@/modules/auth/token.service";

const tokenService = new TokenService();

export function extractUser() {
    return (req: Request, _res: Response, next: NextFunction) => {
        const cookie = req.cookies.mysagra_token;
        const payload = tokenService.getTokenPayload(cookie);

        if (payload) {
            req.user = payload
            next();
            return;
        }

        req.user = undefined;
        next()
        return;
    }
}