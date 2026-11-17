-- CreateTable
CREATE TABLE `displays` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(250) NULL,
    `view` ENUM('READY', 'PREPARING', 'HYBRID') NOT NULL DEFAULT 'READY',
    `showAlert` BOOLEAN NOT NULL DEFAULT true,
    `autoScroll` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `displays_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DisplayToStation` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_DisplayToStation_AB_unique`(`A`, `B`),
    INDEX `_DisplayToStation_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_DisplayToStation` ADD CONSTRAINT `_DisplayToStation_A_fkey` FOREIGN KEY (`A`) REFERENCES `displays`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DisplayToStation` ADD CONSTRAINT `_DisplayToStation_B_fkey` FOREIGN KEY (`B`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
