import dotenv from 'dotenv'
import z from 'zod';

dotenv.config();


const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    PORT: z.preprocess(
        (val) => val === undefined ? undefined : Number(val),
        z.number().int().min(0).max(65535).optional()
    ),
    DATABASE_URL: z.string(),
    PEPPER: z.string(),
    JWT_SECRET: z.string(),
    ALLOWED_ORIGINS: z.preprocess(
        (val) => typeof val === 'string' ? val.split(',').map(url => url.trim()) : [],
        z.array(z.url())
    ),
    TRUST_PROXY_LEVEL: z.preprocess(
        (val) => val === undefined ? undefined : Number(val),
        z.number().int().min(0).optional()
    ),
    REDIS_URL: z.url(),
    REDIS_CACHE_TTL: z.number().default(60 * 60 * 24),
    FILE_BASE_PATH: z.string().optional()
}).strip()

const { error, data } = envSchema.safeParse(process.env)

if (error) {
    console.error(`Error during validation of .env variables: `, error);
    process.exit(1);
}

export const env = {
    NODE_ENV: data.NODE_ENV || "development",
    PORT: data.PORT || 4300,
    DATABASE_URL: data.DATABASE_URL,
    PEPPER: data.PEPPER,
    JWT_SECRET: data.JWT_SECRET,
    ALLOWED_ORIGINS: data.ALLOWED_ORIGINS,
    TRUST_PROXY_LEVEL: data.TRUST_PROXY_LEVEL,
    REDIS_URL: data.REDIS_URL,
    REDIS_CACHE_TTL: data.REDIS_CACHE_TTL,
    FILE_BASE_PATH: data.FILE_BASE_PATH ? data.FILE_BASE_PATH : data.NODE_ENV === "production" ? "/app" : process.cwd()
}