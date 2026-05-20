-- AlterTable
ALTER TABLE `categories` ADD COLUMN `stationId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'PARTIAL', 'COMPLETED', 'PICKED_UP', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `stations` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `stations_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders_stations_states` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PARTIAL', 'COMPLETED', 'PICKED_UP', 'CANCELLED') NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `orders_stations_states_orderId_stationId_key`(`orderId`, `stationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders_stations_states` ADD CONSTRAINT `orders_stations_states_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders_stations_states` ADD CONSTRAINT `orders_stations_states_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
