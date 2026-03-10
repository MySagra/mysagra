-- AlterTable
ALTER TABLE `orders` ADD COLUMN `cashRegisterId` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `printers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `port` INTEGER NOT NULL DEFAULT 9100,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `printers_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_registers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `defaultPrinterId` VARCHAR(191) NULL,

    UNIQUE INDEX `cash_registers_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_cashRegisterId_fkey` FOREIGN KEY (`cashRegisterId`) REFERENCES `cash_registers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_defaultPrinterId_fkey` FOREIGN KEY (`defaultPrinterId`) REFERENCES `printers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
