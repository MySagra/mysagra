-- RenameTable
RENAME TABLE `Banner` TO `banners`;

-- CreateTable
CREATE TABLE `order_instructions` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `position` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
