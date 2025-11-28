-- AlterTable
ALTER TABLE `foods` ADD COLUMN `printerId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `foods` ADD CONSTRAINT `foods_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `printers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
