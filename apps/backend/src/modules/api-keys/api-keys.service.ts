import { prisma } from "@mysagra/database"
import { CreateApiKeyInput, ApiKeyPrefixSchema, CreateApiKeyResponse } from "@mysagra/schemas"
import { randomBytes, createHmac } from 'node:crypto'
import { env } from '@/config/env'
import { redisClient } from "@/lib/redis"
export class ApiKeysService {

    async getAPIKeys() {
        return await prisma.apiKey.findMany({
            omit: { hash_key: true }
        });
    }

    async getAPIKey(id: string) {
        return await prisma.apiKey.findUnique({
            where: { id },
            omit: { hash_key: true }
        })
    }

    async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
        const key = await this.generateApiKey();
        const prefix = input.type === "WEBAPP" ? ApiKeyPrefixSchema.enum.ms_wb_ : ApiKeyPrefixSchema.enum.ms_pt_

        const newKey = await prisma.apiKey.create({
            data: {
                hash_key: await this.hashApiKey(prefix + key),
                name: input.name,
                type: input.type,
                last_digits: key.slice(-4),
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
        const redisKey = `apiKey:${key.hash_key}`;
        await redisClient.setEx(redisKey, env.REDIS_CACHE_TTL, JSON.stringify({ status: 'REVOKED' }));
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