/*
  Warnings:

  - You are about to drop the `banner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `banner`;

-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('EVENT', 'SPONSOR') NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `facebook` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT 'fecc01',
    `dateTime` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_instructions` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `position` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
