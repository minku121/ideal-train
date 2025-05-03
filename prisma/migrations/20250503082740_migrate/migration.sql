/*
  Warnings:

  - You are about to drop the column `paidDate` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentNotes` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Order` DROP COLUMN `paidDate`,
    DROP COLUMN `paymentMethod`,
    DROP COLUMN `paymentNotes`,
    DROP COLUMN `paymentStatus`;

-- AlterTable
ALTER TABLE `UserSettings` ADD COLUMN `additionalSettings` JSON NULL,
    ADD COLUMN `adminDashboardView` VARCHAR(191) NULL,
    ADD COLUMN `autoAssignDisputes` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `darkMode` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `defaultPaymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `disputeNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `disputeResponseTime` VARCHAR(191) NULL,
    ADD COLUMN `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `enableAdvancedFeatures` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    ADD COLUMN `logsRetentionDays` INTEGER NULL,
    ADD COLUMN `mediatorBio` TEXT NULL,
    ADD COLUMN `orderStatusNotifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#7C3AED',
    ADD COLUMN `showEmail` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `showOrderHistory` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `showProfile` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `systemAlerts` BOOLEAN NOT NULL DEFAULT true;
