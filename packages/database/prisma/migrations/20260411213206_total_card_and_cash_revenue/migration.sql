/*
  Warnings:

  - Added the required column `totalCardRevenue` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCashRevenue` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `report` ADD COLUMN `totalCardRevenue` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `totalCashRevenue` DECIMAL(65, 30) NOT NULL;
