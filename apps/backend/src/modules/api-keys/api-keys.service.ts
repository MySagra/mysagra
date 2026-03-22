import { generateApiKey, hashApiKey } from "@/lib/apiKeys"
import { prisma } from "@mysagra/database"
import { CreateApiKeyInput, ApiKeyPrefix, CreateApiKeyResponse } from "@mysagra/schemas"

export class ApiKeysService {

    async getAPIKeys() {
        return await prisma.apiKey.findMany();
    }

    async getAPIKey(id: string) {
        return await prisma.apiKey.findUnique({
            where: {
                id
            }
        })
    }

    async createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResponse>{
        const key = await generateApiKey();

        const newKey = await prisma.apiKey.create({
            data: {
                hash_key: await hashApiKey(key),
                name: input.name,
                type: input.type,
                last_digits: key.slice(-4),
                prefix: input.type === "WEBAPP" ? ApiKeyPrefix.enum.ms_wb_ : ApiKeyPrefix.enum.ms_pt_
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