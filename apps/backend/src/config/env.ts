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
        z.array(z.string().url())
    )
}).strip()

const { success, error, data } = envSchema.safeParse(process.env)

if(error) {
    console.error(`Error during validation of .env variables: `, error.errors);
    process.exit(1);
}

export const env = {
    NODE_ENV: data.NODE_ENV || "development",
    PORT: data.PORT || 4300,
    DATABASE_URL: data.DATABASE_URL,
    PEPPER: data.PEPPER,
    JWT_SECRET: data.JWT_SECRET,
    ALLOWED_ORIGINS: data.ALLOWED_ORIGINS
}