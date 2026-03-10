-- AlterTable
ALTER TABLE `categories` ADD COLUMN `printerId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `printers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
