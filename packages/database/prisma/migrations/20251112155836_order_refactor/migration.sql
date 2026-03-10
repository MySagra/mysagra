/*
  Warnings:

  - You are about to drop the `confirmed_orders` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `total` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `confirmed_orders` DROP FOREIGN KEY `confirmed_orders_orderId_fkey`;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `confirmedAt` DATETIME(3) NULL,
    ADD COLUMN `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `paymentMethod` ENUM('CASH', 'CARD') NULL,
    ADD COLUMN `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'PICKED_UP') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `surcharge` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `ticketNumber` INTEGER NULL,
    ADD COLUMN `total` DECIMAL(65, 30) NOT NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `confirmed_orders`;
