/*
  Warnings:

  - The primary key for the `confirmed_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `confirmed_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `confirmed_orders` DROP PRIMARY KEY,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `ticketNumber` INTEGER NULL,
    ADD PRIMARY KEY (`id`);
