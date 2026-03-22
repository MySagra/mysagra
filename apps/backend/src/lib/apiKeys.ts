import { randomBytes, createHmac } from 'node:crypto'
import { env } from '@/config/env'

export async function generateApiKey() {
    return randomBytes(32).toString('base64url')
}

export async function hashApiKey(key: string) {
    return createHmac('sha256', env.PEPPER)
        .update(key)
        .digest('hex');
}