import { Request, Response, NextFunction } from "express"
import { TokenService } from "@/modules/auth/token.service";
import { redisConnection } from "@/lib/redis";
import { logger } from "@/config/logger";
import { UnauthorizedError, InternalServerError } from "@/common/errors";

const tokenService = new TokenService();

export async function validateJwt(req: Request, res: Response, next: NextFunction) {
    const cookie = req.cookies.mysagra_token;
    const payload = tokenService.getTokenPayload(cookie);

    if (!payload) {
        req.user = undefined;
        return next();
    }

    try {
        const isBlackListed = await redisConnection.get(`blacklist:${cookie}`);

        if (isBlackListed) {
            throw new UnauthorizedError("Session expired or logged out");
        }

        req.user = payload;
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }
        logger.error("Failed to get the token in blacklist", error);
        throw new InternalServerError();
    }
}