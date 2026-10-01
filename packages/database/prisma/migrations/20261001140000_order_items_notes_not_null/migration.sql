/*
  order_items.notes becomes NOT NULL DEFAULT ''.
  With NULL notes the unique (orderId, foodId, notes) never matched, because NULL <> NULL.
*/

-- MigrateData
UPDATE `order_items` SET `notes` = '' WHERE `notes` IS NULL;

-- AlterTable
ALTER TABLE `order_items` MODIFY `notes` VARCHAR(255) NOT NULL DEFAULT '';
