/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `refresh_tokens_token_key` ON `refresh_tokens`;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `token` VARCHAR(500) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `refresh_tokens_token_key` ON `refresh_tokens`(`token`);
