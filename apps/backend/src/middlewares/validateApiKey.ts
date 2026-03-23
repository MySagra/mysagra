import { Request, Response, NextFunction } from "express"
import { ApiKeyPrefixSchema } from "@mysagra/schemas";
import { ApiKeysService } from "@/modules/api-keys/api-keys.service";
import { redisClient } from "@/lib/redis";
import { prisma } from "@mysagra/database";
import { logger } from "@/config/logger";
import { env } from "@/config/env";

const apiKeyService = new ApiKeysService();
const LAST_USED_THROTTLE_SECONDS = 60 * 5;

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
    const rawKey = req.header('X-API-KEY');

    if (!rawKey) {
        return next();
    }

    try {
        if (typeof rawKey !== 'string') {
            res.status(400).json({ message: "Malformed X-API-KEY header" });
            return;
        }

        const prefix = rawKey.substring(0, 6);
        const parsed = ApiKeyPrefixSchema.safeParse(prefix);

        if (!parsed.success) {
            res.status(400).json({ message: "Invalid API key" });
            return;
        }

        //check redis
        const hash = await apiKeyService.hashApiKey(rawKey);
        const redisKey = `apiKey:${hash}`

        const cachedKey = await redisClient.get(redisKey);

        if (!cachedKey) {
            const dbKey = await prisma.apiKey.findUnique({
                where: {
                    hash_key: hash
                }
            });

            if (!dbKey) {
                res.status(401).json({ message: "Invalid API Key." });
                return;
            }

            if (dbKey.revokedAt) {
                await redisClient.setEx(redisKey, env.REDIS_CACHE_TTL, JSON.stringify({ status: 'REVOKED' }));
                res.status(403).json({ message: "API Key has been revoked." });
                return;
            }

            const now = new Date();
            const activeData = { status: 'ACTIVE', prefix: dbKey.prefix, type: dbKey.type, lastUsedUpdatedAt: now.getTime() };
            await Promise.all([
                redisClient.setEx(redisKey, env.REDIS_CACHE_TTL, JSON.stringify(activeData)),
                prisma.apiKey.update({ where: { hash_key: hash }, data: { lastUsedAt: now } })
            ]);
        }
        else {
            const keyData = JSON.parse(cachedKey);

            if (keyData.status === 'REVOKED') {
                res.status(403).json({ message: "API Key has been revoked." });
                return;
            }

            const lastUpdated: number = keyData.lastUsedUpdatedAt ?? 0;
            if (Date.now() - lastUpdated > LAST_USED_THROTTLE_SECONDS * 1000) {
                const now = new Date();
                const updatedData = { ...keyData, lastUsedUpdatedAt: now.getTime() };
                redisClient.setEx(redisKey, env.REDIS_CACHE_TTL, JSON.stringify(updatedData))
                    .then(() => prisma.apiKey.update({ where: { hash_key: hash }, data: { lastUsedAt: now } }))
                    .catch(err => logger.error("Error updating lastUsedAt:", err));
            }
        }

        req.apiKey = {
            prefix: parsed.data,
            rawKey
        }
        next();
    } catch (error) {
        logger.error("Error during API Key validation:", error);
        res.status(500).json({ message: "Internal server error during authentication." });
    }
}