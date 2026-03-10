/*
  Warnings:

  - The primary key for the `orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dateTime` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to drop the `foods_ordered` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[displayCode]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayCode` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subTotal` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `foods_ordered` DROP FOREIGN KEY `foods_ordered_foodId_fkey`;

-- DropForeignKey
ALTER TABLE `foods_ordered` DROP FOREIGN KEY `foods_ordered_orderId_fkey`;

-- AlterTable
ALTER TABLE `orders` DROP PRIMARY KEY,
    DROP COLUMN `dateTime`,
    DROP COLUMN `price`,
    ADD COLUMN `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `displayCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `subTotal` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `foods_ordered`;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `orderId` INTEGER NOT NULL,
    `foodId` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,

    UNIQUE INDEX `order_items_orderId_foodId_key`(`orderId`, `foodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `confirmed_orders` (
    `ticketNumber` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `status` ENUM('CONFIRMED', 'COMPLETED', 'PICKED_UP') NOT NULL DEFAULT 'CONFIRMED',
    `paymentMethod` ENUM('CASH', 'CARD') NOT NULL,
    `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `surcharge` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `total` DECIMAL(65, 30) NOT NULL,
    `confirmedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `confirmed_orders_orderId_key`(`orderId`),
    PRIMARY KEY (`ticketNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `orders_displayCode_key` ON `orders`(`displayCode`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `foods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `confirmed_orders` ADD CONSTRAINT `confirmed_orders_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
