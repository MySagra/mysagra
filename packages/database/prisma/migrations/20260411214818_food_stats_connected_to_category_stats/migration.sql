/*
  Warnings:

  - You are about to drop the column `reportId` on the `food_stats` table. All the data in the column will be lost.
  - Added the required column `categoryStatsId` to the `food_stats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `food_stats` DROP FOREIGN KEY `food_stats_reportId_fkey`;

-- DropIndex
DROP INDEX `food_stats_reportId_fkey` ON `food_stats`;

-- AlterTable
ALTER TABLE `food_stats` DROP COLUMN `reportId`,
    ADD COLUMN `categoryStatsId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `food_stats` ADD CONSTRAINT `food_stats_categoryStatsId_fkey` FOREIGN KEY (`categoryStatsId`) REFERENCES `category_stats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
