import { Request, Response, NextFunction } from "express"
import { ApiKeyPrefixSchema } from "@mysagra/schemas";
import { ApiKeysService } from "@/modules/api-keys/api-keys.service";
import { redisConnection } from "@/lib/redis";
import { prisma } from "@mysagra/database";
import { logger } from "@/config/logger";
import { env } from "@/config/env";
import { BadRequestError, UnauthorizedError, ForbiddenError, InternalServerError } from "@/common/errors";

const apiKeyService = new ApiKeysService();
const LAST_USED_THROTTLE_SECONDS = 60 * 5;

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
    const rawKey = req.header('X-API-KEY');

    if (!rawKey) {
        return next();
    }

    try {
        if (typeof rawKey !== 'string') {
            throw new BadRequestError("Malformed X-API-KEY header");
        }

        const prefix = rawKey.substring(0, 6);
        const parsed = ApiKeyPrefixSchema.safeParse(prefix);

        if (!parsed.success) {
            throw new BadRequestError("Invalid API key");
        }

        //check redis
        const hash = await apiKeyService.hashApiKey(rawKey);
        const redisKey = `apiKey:${hash}`

        const cachedKey = await redisConnection.get(redisKey);

        if (!cachedKey) {
            const dbKey = await prisma.apiKey.findUnique({
                where: {
                    hash_key: hash
                }
            });

            if (!dbKey) {
                throw new UnauthorizedError("Invalid API Key");
            }

            if (dbKey.revokedAt) {
                await redisConnection.setex(redisKey, env.REDIS_CACHE_TTL, JSON.stringify({ status: 'REVOKED' }));
                throw new ForbiddenError("API Key has been revoked");
            }

            const now = new Date();
            const activeData = { status: 'ACTIVE', prefix: dbKey.prefix, type: dbKey.type, lastUsedUpdatedAt: now.getTime() };
            await Promise.all([
                redisConnection.setex(redisKey, env.REDIS_CACHE_TTL, JSON.stringify(activeData)),
                prisma.apiKey.update({ where: { hash_key: hash }, data: { lastUsedAt: now } })
            ]);
        }
        else {
            const keyData = JSON.parse(cachedKey);

            if (keyData.status === 'REVOKED') {
                throw new ForbiddenError("API Key has been revoked");
            }

            const lastUpdated: number = keyData.lastUsedUpdatedAt ?? 0;
            if (Date.now() - lastUpdated > LAST_USED_THROTTLE_SECONDS * 1000) {
                const now = new Date();
                const updatedData = { ...keyData, lastUsedUpdatedAt: now.getTime() };
                redisConnection.setex(redisKey, env.REDIS_CACHE_TTL, JSON.stringify(updatedData))
                    .then(() => prisma.apiKey.update({ where: { hash_key: hash }, data: { lastUsedAt: now } }))
                    .catch(err => {
                        // Ignore P2025 (record not found) - can occur if key was deleted between Redis read and DB update
                        if (err.code !== 'P2025') {
                            logger.error("Error updating lastUsedAt:", err);
                        }
                    });
            }
        }

        req.apiKey = {
            prefix: parsed.data,
            rawKey
        }
        next();
    } catch (error) {
        if (error instanceof BadRequestError || error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            throw error;
        }
        logger.error("Error during API Key validation:", error);
        throw new InternalServerError();
    }
}