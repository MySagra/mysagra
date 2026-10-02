-- CreateTable
CREATE TABLE `settings` (
    `sagraId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`sagraId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_sagraId_fkey` FOREIGN KEY (`sagraId`) REFERENCES `sagra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
