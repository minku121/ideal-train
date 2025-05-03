/*
  Warnings:

  - You are about to drop the column `additionalSettings` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `adminDashboardView` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `autoAcceptOrders` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `commissionAlerts` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `darkMode` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `defaultPaymentMethod` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `disputeNotifications` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotifications` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `showEmail` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `showOrderHistory` on the `UserSettings` table. All the data in the column will be lost.
  - You are about to drop the column `showProfile` on the `UserSettings` table. All the data in the column will be lost.
  - Added the required column `upiId` to the `UserSettings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `paidDate` DATETIME(3) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `paymentNotes` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NULL,
    ADD COLUMN `upiId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `UserSettings` DROP COLUMN `additionalSettings`,
    DROP COLUMN `adminDashboardView`,
    DROP COLUMN `autoAcceptOrders`,
    DROP COLUMN `commissionAlerts`,
    DROP COLUMN `darkMode`,
    DROP COLUMN `defaultPaymentMethod`,
    DROP COLUMN `disputeNotifications`,
    DROP COLUMN `emailNotifications`,
    DROP COLUMN `language`,
    DROP COLUMN `primaryColor`,
    DROP COLUMN `showEmail`,
    DROP COLUMN `showOrderHistory`,
    DROP COLUMN `showProfile`,
    ADD COLUMN `upiId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `AppLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    `message` TEXT NOT NULL,
    `source` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppLog_level_idx`(`level`),
    INDEX `AppLog_source_idx`(`source`),
    INDEX `AppLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
