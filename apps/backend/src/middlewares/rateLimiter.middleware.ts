import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";
import { env } from "@/config/env";

const hybridKeyGenerator = (req: Request, res: Response): string => {
    if (req.user && req.user.sub !== 0) {
        return `user-${req.user.sub}`;
    }

    const rawIp = req.ip || req.socket.remoteAddress || "0.0.0.0";
    return ipKeyGenerator(rawIp)
};

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: "Too many login attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // count only failed attempts
    skip: () => env.NODE_ENV !== 'production'
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    limit: (req: Request, res: Response) => {
        if (req.user?.role === 'admin' || req.user?.role === 'operator') {
            return 1000; // High limit for working staff
        }
        return 100; // Lower limit for guests/public
    },
    keyGenerator: hybridKeyGenerator,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            message: options.message.message || "Too many requests"
        });
    },
    skip: (req) => {
        if (env.NODE_ENV !== 'production') return true;
        if (req.path.startsWith('/health') || req.path.startsWith('/metrics')) return true;
        return false;
    }
})