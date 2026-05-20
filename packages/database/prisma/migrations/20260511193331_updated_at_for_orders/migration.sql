/*
  Warnings:

  - Added the required column `updatedAt` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `updatedAt` DATETIME(3) NULL;

UPDATE `orders` SET `updatedAt` = `createdAt` WHERE `updatedAt` IS NULL;

ALTER TABLE `orders` MODIFY COLUMN `updatedAt` DATETIME(3) NOT NULL;
