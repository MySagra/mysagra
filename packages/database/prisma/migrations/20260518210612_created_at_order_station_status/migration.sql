/*
  Warnings:

  - Added the required column `updatedAt` to the `orders_stations_states` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders_stations_states` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
