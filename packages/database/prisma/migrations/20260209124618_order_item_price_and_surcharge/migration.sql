/*
  Warnings:

  - Added the required column `total` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `total` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `unitPrice` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `unitSurcharge` DECIMAL(65, 30) NOT NULL DEFAULT 0;
