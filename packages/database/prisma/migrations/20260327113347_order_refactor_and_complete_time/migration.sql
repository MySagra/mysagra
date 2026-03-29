/*
  Warnings:

  - The primary key for the `orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `displayCode` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_orderId_fkey`;

-- AlterTable
ALTER TABLE `order_items` MODIFY `orderId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `orders` DROP PRIMARY KEY,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `displayCode` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
