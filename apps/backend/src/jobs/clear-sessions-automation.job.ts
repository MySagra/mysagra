import { logger } from "@/config/logger";
import { sessionsService } from "@/modules/auth/sessions.service";
import cron from 'node-cron';

const runClearSessions = async () => {
    logger.info("[Cron] Running clear old sessions job");
    const res = await sessionsService.clearOldSessions();
    logger.info(`[Cron] Job ended, deleted ${res.count} sessions`);
};

export const initClearSessionsJob = async () => {
    await runClearSessions();

    cron.schedule('0 7 * * *', () => {
        runClearSessions().catch((err) => {
            logger.error(`[Cron] Clear sessions job failed: ${err.message}`);
        });
    });

    logger.info('[Cron] Clear sessions job scheduled (daily at 07:00)');
};