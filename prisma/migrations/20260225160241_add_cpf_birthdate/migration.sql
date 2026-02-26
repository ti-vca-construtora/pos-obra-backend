/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `birthDate` VARCHAR(191) NULL,
    ADD COLUMN `cpf` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `usuario_cpf_key` ON `usuario`(`cpf`);
