import { Worker, Job } from "bullmq";
import { reportService } from "@/modules/report/report.service";
import { sagraService } from "@/modules/sagra/sagra.service";
import { logger } from "@/config/logger";
import { createWorkerConnection } from "@/lib/redis";

export const initReportWorker = () => {
    const worker = new Worker(
        'report-queue',
        async (job: Job) => {
            const config = sagraService.getConfig();
            const now = new Date();

            logger.info(`[Worker] Starting scheduled report for Sagra: ${job.data.sagraId}`);

            // Execute the heavy lifting (Aggregation + Purge)
            await reportService.generateReport()

            // Reset the closing timer in RAM and DB
            await sagraService.updateLastClosing(now);
        },
        {
            connection: createWorkerConnection,
            concurrency: 1
        }
    );

    worker.on('failed', (job, err) => {
        logger.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
    });
}