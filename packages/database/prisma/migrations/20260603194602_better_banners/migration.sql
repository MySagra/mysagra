/*
  Warnings:

  - You are about to drop the column `dateTime` on the `banners` table. All the data in the column will be lost.
  - Added the required column `position` to the `banners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banners` DROP COLUMN `dateTime`,
    ADD COLUMN `endsAt`     DATETIME(3)  NULL,
    ADD COLUMN `position`   INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN `startsAt`   DATETIME(3)  NULL,
    ADD COLUMN `telephone`  VARCHAR(191) NULL;

-- Remove temporary default
ALTER TABLE `banners` ALTER COLUMN `position` DROP DEFAULT;
