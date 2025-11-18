import { Request, Response, NextFunction } from "express"
import { TokenService } from "@/services/token.service";
import { TokenPayload } from "@/schemas/auth";

const tokenService = new TokenService();

export function extractUser() {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        let user: TokenPayload = {
            sub: "0",
            username: "guest",
            role: "guest",
            iat: 0
        };

        if (authHeader) {
            const token = authHeader.split(" ")[1];
            if (token) {
                let payload = tokenService.getPayload(token);
                
                if (!payload) {
                    res.status(401).json({ message: "Invalid or expired token" });
                    return;
                }
                user = payload;
            }
        }

        req.user = user
        next();
    }
}