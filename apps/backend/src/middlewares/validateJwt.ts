import { Request, Response, NextFunction } from "express"
import { TokenService } from "@/modules/auth/token.service";
import { redisClient } from "@/lib/redis";
import { logger } from "@/config/logger";

const tokenService = new TokenService();

export async function validateJwt(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies.mysagra_token;
    const payload = tokenService.getTokenPayload(cookie);

    if (!payload) {
        req.user = undefined;
        return next();
    }

    try {
        const isBlackListed = await redisClient.get(`blacklist:${cookie}`);

        if (isBlackListed) {
            res.status(401).json({ message: "Session expired or logged out." });
            return;
        }

        req.user = payload;
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
        logger.error("Failed to get the token in blacklist", error)
    }
}