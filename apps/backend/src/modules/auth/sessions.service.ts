import { env } from "@/config/env"
import { prisma } from "@mysagra/database";
import { SessionPayload, TokenPayloadSchema } from "@mysagra/schemas";
import { redisConnection } from "@/lib/redis";
import crypto from "crypto";

const SESSION_PREFIX = "session";
const USERS_PREFIX = "user:sessions"

export class SessionsService {
    async generateSessionId() {
        return crypto.randomBytes(32).toString("hex");
    }

    async createSession(
        sessionId: string,
        userId: string,
        payload: SessionPayload,
        userAgent?: string
    ) {
        const expiresAt = new Date(Date.now() + env.SESSION_TTL_MIN * 1000);

        await Promise.all([
            redisConnection.multi()
                .setex(`${SESSION_PREFIX}:${sessionId}`, env.SESSION_TTL_MIN, JSON.stringify(payload))
                .sadd(`${USERS_PREFIX}:${userId}`, sessionId)
                .expire(`${USERS_PREFIX}:${userId}`, env.SESSION_TTL_MIN)
                .exec(),

            prisma.session.create({
                data: { sessionId, userId, userAgent, expiresAt },
                select: { userId: true, createdAt: true }
            })
        ])
    }

    async getSessionPayload(sessionId: string): Promise<SessionPayload | null> {
        const key = `${SESSION_PREFIX}:${sessionId}`;
        const raw = await redisConnection.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as SessionPayload;
    }

    async revokeSessionBySessionId(sessionId: string): Promise<void> {
        await Promise.all([
            redisConnection.del(`${SESSION_PREFIX}:${sessionId}`),
            prisma.session.updateMany({
                where: { sessionId },
                data: { revokedAt: new Date() }
            })
        ])
    }

    async revokeSessionByUserId(userId: string) {
        const userKey = `${USERS_PREFIX}:${userId}`;
        const sessionIds = await redisConnection.smembers(userKey);

        if (sessionIds.length === 0) return;

        const pipeline = redisConnection.pipeline();
        for (const sid of sessionIds) {
            pipeline.del(`${SESSION_PREFIX}:${sid}`);
        }
        pipeline.del(userKey);
        await pipeline.exec();

        await prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        });
    }
}

export const sessionsService = new SessionsService();