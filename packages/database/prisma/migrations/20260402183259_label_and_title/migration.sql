/*
  Warnings:

  - Added the required column `label` to the `Banner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banner` ADD COLUMN `label` VARCHAR(191) NOT NULL,
    MODIFY `title` VARCHAR(191) NULL;
