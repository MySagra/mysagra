/*
  Warnings:

  - The primary key for the `confirmed_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `confirmed_orders` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `DailyTicketCounter` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `DailyTicketCounter_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
