-- RedefineIndex
CREATE UNIQUE INDEX `order_items_orderId_foodId_notes_key` ON `order_items`(`orderId`, `foodId`, `notes`);
DROP INDEX `unique_order_food_notes` ON `order_items`;
