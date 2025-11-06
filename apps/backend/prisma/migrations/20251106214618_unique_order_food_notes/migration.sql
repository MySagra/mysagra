/*
  Warnings:

  - A unique constraint covering the columns `[orderId,foodId,notes]` on the table `order_items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_orderId_fkey`;

-- DropIndex
DROP INDEX `order_items_orderId_foodId_key` ON `order_items`;

-- CreateIndex
CREATE UNIQUE INDEX `unique_order_food_notes` ON `order_items`(`orderId`, `foodId`, `notes`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
