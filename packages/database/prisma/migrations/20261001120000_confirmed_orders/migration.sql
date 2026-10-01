/*
  Split confirmation data from `orders` into `confirmed_orders` (1:0..1)
  and replace table/customer sentinel strings with NULL.

  Data is preserved: confirmed orders are copied before the old columns are dropped.
  Legacy confirmed orders missing ticketNumber/paymentMethod get fallbacks (0 / CASH).
*/

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_userId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_cashRegisterId_fkey`;

-- DropForeignKey
ALTER TABLE `orders_stations_states` DROP FOREIGN KEY `orders_stations_states_orderId_fkey`;

-- CreateTable
CREATE TABLE `confirmed_orders` (
    `orderId` VARCHAR(191) NOT NULL,
    `confirmedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `ticketNumber` INTEGER NOT NULL,
    `paymentMethod` ENUM('CASH', 'CARD') NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `cashRegisterId` VARCHAR(191) NULL,

    INDEX `confirmed_orders_ticketNumber_idx`(`ticketNumber`),
    PRIMARY KEY (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- MigrateData: copy confirmation data of every order that was confirmed
INSERT INTO `confirmed_orders`
    (`orderId`, `confirmedAt`, `completedAt`, `ticketNumber`, `paymentMethod`, `discount`, `total`, `userId`, `cashRegisterId`)
SELECT
    `id`,
    COALESCE(`confirmedAt`, `createdAt`),
    `completedAt`,
    COALESCE(`ticketNumber`, 0),
    COALESCE(`paymentMethod`, 'CASH'),
    `discount`,
    `total`,
    `userId`,
    `cashRegisterId`
FROM `orders`
WHERE `confirmedAt` IS NOT NULL
   OR `status` IN ('CONFIRMED', 'PARTIAL', 'COMPLETED', 'PICKED_UP');

-- MigrateData: station states can only belong to confirmed orders
DELETE FROM `orders_stations_states`
WHERE `orderId` NOT IN (SELECT `orderId` FROM `confirmed_orders`);

-- AlterTable: table/customer become optional
ALTER TABLE `orders` MODIFY `table` VARCHAR(191) NULL,
    MODIFY `customer` VARCHAR(191) NULL;

-- MigrateData: sentinel strings -> NULL
UPDATE `orders` SET `table` = NULL
WHERE `table` IN ('NO_TABLE', 'NO_TABLE_PRESET', '');

UPDATE `orders` SET `customer` = NULL
WHERE `customer` IN ('NO_CUSTOMER', '');

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `cashRegisterId`,
    DROP COLUMN `completedAt`,
    DROP COLUMN `confirmedAt`,
    DROP COLUMN `discount`,
    DROP COLUMN `paymentMethod`,
    DROP COLUMN `ticketNumber`,
    DROP COLUMN `total`,
    DROP COLUMN `userId`;

-- CreateIndex
CREATE INDEX `orders_status_createdAt_idx` ON `orders`(`status`, `createdAt`);

-- AddForeignKey
ALTER TABLE `confirmed_orders` ADD CONSTRAINT `confirmed_orders_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `confirmed_orders` ADD CONSTRAINT `confirmed_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `confirmed_orders` ADD CONSTRAINT `confirmed_orders_cashRegisterId_fkey` FOREIGN KEY (`cashRegisterId`) REFERENCES `cash_registers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders_stations_states` ADD CONSTRAINT `orders_stations_states_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `confirmed_orders`(`orderId`) ON DELETE CASCADE ON UPDATE CASCADE;
