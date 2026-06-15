import { prisma } from "@mysagra/database";
import { SessionPayload } from "@mysagra/schemas";
import { redisConnection } from "@/lib/redis";
import crypto from "crypto";

const SESSION_PREFIX = "session";
const USERS_PREFIX = "user:sessions"

export class SessionsService {
    async generateSessionId() {
        return crypto.randomBytes(32).toString("hex");
    }

    private getExpiresAt(): Date {
        const now = new Date();
        const expires = new Date();

        expires.setHours(7, 0, 0, 0);
        if (now.getHours() >= 7) {
            expires.setDate(expires.getDate() + 1)
        }

        return expires;
    }

    async createSession(
        sessionId: string,
        userId: string,
        payload: SessionPayload,
        userAgent?: string
    ) {
        const expiresAt = this.getExpiresAt();
        const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

        const [, session] = await Promise.all([
            redisConnection.multi()
                .setex(`${SESSION_PREFIX}:${sessionId}`, ttlSeconds, JSON.stringify(payload))
                .sadd(`${USERS_PREFIX}:${userId}`, sessionId)
                .expire(`${USERS_PREFIX}:${userId}`, ttlSeconds)
                .exec(),

            prisma.session.create({
                data: { sessionId, userId, userAgent, expiresAt }
            })
        ])

        return session;
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

    async clearOldSessions() {
        return await prisma.session.deleteMany({
            where: {
                OR: [
                    {
                        expiresAt: { lte: new Date() },
                        revokedAt: null
                    },
                    {
                        revokedAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
                    }
                ]
            }
        })
    }
}

export const sessionsService = new SessionsService();