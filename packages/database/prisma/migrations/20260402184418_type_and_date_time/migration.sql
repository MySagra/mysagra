/*
  Warnings:

  - You are about to drop the column `badge` on the `banner` table. All the data in the column will be lost.
  - Added the required column `type` to the `Banner` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banner` DROP COLUMN `badge`,
    ADD COLUMN `dateTime` DATETIME(3) NULL,
    ADD COLUMN `type` ENUM('EVENT', 'SPONSOR') NOT NULL;
