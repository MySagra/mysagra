-- MAC address was never used to reach printers (mystampa resolves them by IP)

-- AlterTable
ALTER TABLE `printers` DROP COLUMN `mac`;
