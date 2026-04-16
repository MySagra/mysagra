-- CreateTable
CREATE TABLE `sagra` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'MySagra',
    `lastClosingAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statsIntervalMinutes` INTEGER NOT NULL DEFAULT 60,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `intervalInMinutes` INTEGER NOT NULL DEFAULT 60,
    `totalRevenue` DECIMAL(65, 30) NOT NULL,
    `totalCashRevenue` DECIMAL(65, 30) NOT NULL,
    `totalCardRevenue` DECIMAL(65, 30) NOT NULL,
    `totalOrders` INTEGER NOT NULL,
    `averageCompletitionTime` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_stats` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `categoryName` VARCHAR(191) NOT NULL,
    `revenue` DECIMAL(65, 30) NOT NULL,
    `quantity` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `food_stats` (
    `id` VARCHAR(191) NOT NULL,
    `categoryStatsId` VARCHAR(191) NOT NULL,
    `foodId` VARCHAR(191) NOT NULL,
    `foodName` VARCHAR(191) NOT NULL,
    `revenue` DECIMAL(65, 30) NOT NULL,
    `quantity` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `category_stats` ADD CONSTRAINT `category_stats_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `food_stats` ADD CONSTRAINT `food_stats_categoryStatsId_fkey` FOREIGN KEY (`categoryStatsId`) REFERENCES `category_stats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
