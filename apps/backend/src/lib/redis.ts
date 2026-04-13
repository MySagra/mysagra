import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const createWorkerConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => logger.error('Redis error: ', err));
redisConnection.on('connect', () => logger.info('Redis started succesfully'));
redisConnection.on('reconnecting', () => logger.info('Trying to reconnect to redis...'));

export const connectRedis = async () => {
    try{
        // ioredis auto-connects, but we can wait for the connection to be ready
        await redisConnection.ping();
        logger.info('Redis connection verified');
    }catch(err) {
        logger.error("Failed to connect to redis at the start: ", err)
    }
}