import { prisma } from "@mysagra/database"
import { CreateApiKeyInput, CreateApiKeyResponse, ApiKeyPrefix, ApiKeyType } from "@mysagra/schemas"
import { randomBytes, createHmac } from 'node:crypto'
import { env } from '@/config/env'
import { redisConnection } from "@/lib/redis"

function typeToPrefix(type: ApiKeyType): ApiKeyPrefix {
    switch (type) {
        case "PRINTER": return "ms_pt_";
        case "WEBAPP": return "ms_wb_";
        case "DISPLAY": return "ms_ds_";
    }
}

class ApiKeysService {

    async getAPIKeys() {
        return await prisma.apiKey.findMany({
            omit: { hashKey: true }
        });
    }

    async getAPIKey(id: string) {
        return await prisma.apiKey.findUnique({
            where: { id },
            omit: { hashKey: true }
        })
    }

    async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
        const key = await this.generateApiKey();
        const prefix = typeToPrefix(input.type);

        const newKey = await prisma.apiKey.create({
            data: {
                hashKey: await this.hashApiKey(prefix + key),
                name: input.name,
                type: input.type,
                lastDigits: key.slice(-4),
                prefix: prefix
            }
        })

        return {
            id: newKey.id,
            type: newKey.type,
            apiKey: newKey.prefix + key,
            createdAt: newKey.createdAt
        }
    }

    async revokeApiKey(id: string) {
        const key = await prisma.apiKey.update({
            where: {
                id
            },
            data: {
                revokedAt: new Date()
            }
        })
        const redisKey = `apiKey:${key.hashKey}`;
        await redisConnection.setex(redisKey, env.REDIS_CACHE_TTL, JSON.stringify({ status: 'REVOKED' }));
        return key;
    }

    async hashApiKey(key: string) {
        return createHmac('sha256', env.PEPPER)
            .update(key)
            .digest('hex');
    }

    async generateApiKey() {
        return randomBytes(32).toString('base64url')
    }
}

export const apiKeysService = new ApiKeysService();
