import { generateApiKey, hashApiKey } from "@/lib/apiKeys"
import { prisma } from "@mysagra/database"
import { CreateApiKeyInput, ApiKeyPrefixSchema, CreateApiKeyResponse } from "@mysagra/schemas"

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

    async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse>{
        const key = await generateApiKey();
        const prefix = input.type === "WEBAPP" ? ApiKeyPrefixSchema.enum.ms_wb_ : ApiKeyPrefixSchema.enum.ms_pt_

        const newKey = await prisma.apiKey.create({
            data: {
                hash_key: await hashApiKey(prefix + key),
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
        await prisma.apiKey.update({
            where: {
                id
            },
            data: {
                revokedAt: new Date()
            }
        })
    }
}