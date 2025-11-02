/*
  Warnings:

  - The primary key for the `foods` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `foods_ordered` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `foods_ordered` DROP FOREIGN KEY `foods_ordered_foodId_fkey`;

-- DropIndex
DROP INDEX `foods_ordered_foodId_fkey` ON `foods_ordered`;

-- AlterTable
ALTER TABLE `foods` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `foods_ordered` DROP PRIMARY KEY,
    MODIFY `foodId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`orderId`, `foodId`);

-- CreateTable
CREATE TABLE `ingredients` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_ingredients` (
    `foodId` VARCHAR(191) NOT NULL,
    `ingredientId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`foodId`, `ingredientId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `food_ingredients` ADD CONSTRAINT `food_ingredients_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `foods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_ingredients` ADD CONSTRAINT `food_ingredients_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `foods_ordered` ADD CONSTRAINT `foods_ordered_foodId_fkey` FOREIGN KEY (`foodId`) REFERENCES `foods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
