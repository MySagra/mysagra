import { env } from "./config/env"; // load the .env before prisma
import { logger } from "./config/logger";
import { connectRedis, redisConnection } from "./lib/redis";
import app from "./app";
import { initReportWorker } from "./jobs/report-automation.job";
import { initClearSessionsJob } from "./jobs/clear-sessions-automation.job";
import { setupService } from "./modules/setup/setup.service";

let server: ReturnType<typeof app.listen>

async function startServer() {
  try {
    await connectRedis();
    logger.info('Connection to Redis successful')

    // init istance
    await setupService.init();

    // start bullMQ workers
    initReportWorker()
    await initClearSessionsJob()

    server = app.listen(env.PORT, () => {
      logger.info(`Server is listening on http://localhost:${env.PORT}`);
      logger.info(`Documentation: http://localhost:${env.PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Fatal error during the startup of the server:", error)
    process.exit(1);
  }
}

async function shutdown() {
  try {
    logger.info('Shutting down server...');

    if (redisConnection.status === 'ready') {
      await redisConnection.quit();
      logger.info('Redis connection closed.');
    }

    if (server) {
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();