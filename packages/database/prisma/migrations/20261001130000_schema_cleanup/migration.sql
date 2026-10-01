/*
  Schema cleanup:
  - explicit lengths for orders.table/customer, roles.name, stations.name, banners.color
  - rename reports.averageCompletitionTime -> averageCompletionTime (data preserved),
    nullable without default; 0 (written when no order completed) becomes NULL
  - CHECK constraints on banners (Prisma does not manage them, kept in SQL only)
*/

-- AlterTable
ALTER TABLE `banners` MODIFY `color` VARCHAR(7) NOT NULL DEFAULT 'fecc01';

-- AlterTable
ALTER TABLE `orders` MODIFY `table` VARCHAR(50) NULL,
    MODIFY `customer` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `reports` RENAME COLUMN `averageCompletitionTime` TO `averageCompletionTime`;
ALTER TABLE `reports` MODIFY `averageCompletionTime` INTEGER NULL;

-- MigrateData
UPDATE `reports` SET `averageCompletionTime` = NULL WHERE `averageCompletionTime` = 0;

-- AlterTable
ALTER TABLE `roles` MODIFY `name` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `stations` MODIFY `name` VARCHAR(100) NOT NULL;

-- AddCheckConstraint: only events have dates
ALTER TABLE `banners` ADD CONSTRAINT `banners_event_dates_check`
    CHECK (`type` = 'EVENT' OR (`startsAt` IS NULL AND `endsAt` IS NULL));

-- AddCheckConstraint: event cannot end before it starts
ALTER TABLE `banners` ADD CONSTRAINT `banners_dates_order_check`
    CHECK (`startsAt` IS NULL OR `endsAt` IS NULL OR `endsAt` >= `startsAt`);
