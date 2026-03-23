import { createClient } from "redis";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

export const redisClient = createClient({
    url: env.REDIS_URL
});

redisClient.on('error', (err) => logger.error('Redis error: ', err));
redisClient.on('connect', () => logger.info('Redis started succesfully'));
redisClient.on('reconnecting', () => logger.info('Trying to reconnect to redis...'));

export const connectRedis = async () => {
    try{
        await redisClient.connect();
    }catch(err) {
        logger.error("Failed to connect to redis at the start: ", err)
    }
}