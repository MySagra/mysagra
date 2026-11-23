-- AlterTable
ALTER TABLE `api_keys` MODIFY `type` ENUM('PRINTER', 'WEBAPP', 'DISPLAY') NOT NULL;

-- AlterTable
ALTER TABLE `displays` MODIFY `alert` VARCHAR(250) NULL;
