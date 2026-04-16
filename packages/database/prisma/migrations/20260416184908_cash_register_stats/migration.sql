-- CreateTable
CREATE TABLE `cash_register_stats` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `cashRegisterId` VARCHAR(191) NOT NULL,
    `cashRegisterName` VARCHAR(191) NOT NULL,
    `totalRevenue` DECIMAL(65, 30) NOT NULL,
    `totalCardRevenue` DECIMAL(65, 30) NOT NULL,
    `totalCashRevenue` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cash_register_stats` ADD CONSTRAINT `cash_register_stats_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
