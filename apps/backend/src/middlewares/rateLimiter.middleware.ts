import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    message: {
        message: "Too many login attemps, try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const ip = req.ip ||
            req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
            req.headers['x-real-ip']?.toString() ||
            req.socket.remoteAddress ||
            'unknown';
        return ipKeyGenerator(ip);
    },
    skipSuccessfulRequests: true // count only failed attempts
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    message: {
        message: "Too many login attemps, try again later"
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return Boolean(
            req.path.startsWith('/health') // skip health request
        );
    }
})