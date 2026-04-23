/*
  Warnings:

  - You are about to alter the column `label` on the `banners` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `title` on the `banners` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `cash_registers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `foods` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `ingredients` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `name` on the `printers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `totalRevenue` on the `reports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalCashRevenue` on the `reports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalCardRevenue` on the `reports` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `name` on the `sagra` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE `banners` MODIFY `label` VARCHAR(100) NOT NULL,
    MODIFY `title` VARCHAR(100) NULL,
    MODIFY `description` VARCHAR(250) NULL;

-- AlterTable
ALTER TABLE `cash_registers` MODIFY `name` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `categories` MODIFY `name` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `foods` MODIFY `name` VARCHAR(100) NOT NULL,
    MODIFY `description` VARCHAR(250) NULL;

-- AlterTable
ALTER TABLE `ingredients` MODIFY `name` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `printers` MODIFY `name` VARCHAR(100) NOT NULL,
    MODIFY `description` VARCHAR(250) NULL;

-- AlterTable
ALTER TABLE `reports` MODIFY `totalRevenue` DECIMAL(10, 2) NOT NULL,
    MODIFY `totalCashRevenue` DECIMAL(10, 2) NOT NULL,
    MODIFY `totalCardRevenue` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `sagra` MODIFY `name` VARCHAR(100) NOT NULL DEFAULT 'MySagra';

-- AlterTable
ALTER TABLE `users` MODIFY `username` VARCHAR(100) NOT NULL,
    MODIFY `password` VARCHAR(100) NOT NULL;

-- Delete orphaned records before adding foreign key constraints
DELETE FROM `cash_register_stats` WHERE `reportId` NOT IN (SELECT `id` FROM `reports`);
DELETE FROM `category_stats` WHERE `reportId` NOT IN (SELECT `id` FROM `reports`);

-- AddForeignKey
ALTER TABLE `cash_register_stats` ADD CONSTRAINT `cash_register_stats_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_stats` ADD CONSTRAINT `category_stats_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
