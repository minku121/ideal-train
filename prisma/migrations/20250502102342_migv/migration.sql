/*
  Warnings:

  - You are about to drop the column `brandManagerId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_brandManagerId_fkey`;

-- DropIndex
DROP INDEX `Product_brandManagerId_fkey` ON `Product`;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `brandManagerId`,
    ADD COLUMN `managerId` INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `BrandManager`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
