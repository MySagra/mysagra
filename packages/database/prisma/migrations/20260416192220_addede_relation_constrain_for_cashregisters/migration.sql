-- DropForeignKey
ALTER TABLE `cash_register_stats` DROP FOREIGN KEY `cash_register_stats_reportId_fkey`;

-- DropIndex
DROP INDEX `cash_register_stats_reportId_fkey` ON `cash_register_stats`;

-- AddForeignKey
ALTER TABLE `cash_register_stats` ADD CONSTRAINT `cash_register_stats_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
