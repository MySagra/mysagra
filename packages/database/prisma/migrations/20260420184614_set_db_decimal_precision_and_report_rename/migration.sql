/*
  Warnings:

  - You are about to alter the column `totalRevenue` on the `cash_register_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalCardRevenue` on the `cash_register_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalCashRevenue` on the `cash_register_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `revenue` on the `category_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `revenue` on the `food_stats` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `foods` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `unitPrice` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `unitSurcharge` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `subTotal` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `discount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `surcharge` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the `report` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cash_register_stats` DROP FOREIGN KEY `cash_register_stats_reportId_fkey`;

-- DropForeignKey
ALTER TABLE `category_stats` DROP FOREIGN KEY `category_stats_reportId_fkey`;

-- DropIndex
DROP INDEX `cash_register_stats_reportId_fkey` ON `cash_register_stats`;

-- DropIndex
DROP INDEX `category_stats_reportId_fkey` ON `category_stats`;

-- AlterTable
ALTER TABLE `cash_register_stats` MODIFY `totalRevenue` DECIMAL(10, 2) NOT NULL,
    MODIFY `totalCardRevenue` DECIMAL(10, 2) NOT NULL,
    MODIFY `totalCashRevenue` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `category_stats` MODIFY `revenue` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `food_stats` MODIFY `revenue` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `foods` MODIFY `price` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `order_items` MODIFY `total` DECIMAL(10, 2) NOT NULL,
    MODIFY `unitPrice` DECIMAL(10, 2) NOT NULL,
    MODIFY `unitSurcharge` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `orders` MODIFY `subTotal` DECIMAL(10, 2) NOT NULL,
    MODIFY `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY `surcharge` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY `total` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Report` RENAME to `reports`

