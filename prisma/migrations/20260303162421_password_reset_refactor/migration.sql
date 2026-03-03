/*
  Warnings:

  - You are about to drop the column `email` on the `password_reset` table. All the data in the column will be lost.
  - Added the required column `userId` to the `password_reset` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `password_reset_email_idx` ON `password_reset`;

-- AlterTable
ALTER TABLE `password_reset` DROP COLUMN `email`,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `password_reset_userId_idx` ON `password_reset`(`userId`);

-- AddForeignKey
ALTER TABLE `password_reset` ADD CONSTRAINT `password_reset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
