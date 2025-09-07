import dotenv from 'dotenv'
import Joi from 'joi'

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test'),
    PORT: Joi.number().min(0).max(65535),
    DATABASE_URL: Joi.string().required(),
    PEPPER: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    FRONTEND_URL: Joi.string().required()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if(error) {
    console.error(`Error during validation of .env variables: `, error.details);
    process.exit(1);
}

export const env = {
    NODE_ENV: envVars.NODE_ENV || "development",
    PORT: envVars.PORT || 4300,
    DATABASE_URL: envVars.DATABASE_URL,
    PEPPER: envVars.PEPPER,
    JWT_SECRET: envVars.JWT_SECRET,
    FRONTEND_URL: envVars.FRONTEND_URL
}