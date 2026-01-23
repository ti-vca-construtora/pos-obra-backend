/*
  Warnings:

  - Added the required column `cpfCnpjCliente` to the `AtendimentoMobuss` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `atendimentomobuss` ADD COLUMN `cpfCnpjCliente` VARCHAR(191) NOT NULL,
    ADD COLUMN `emailSolicitante` VARCHAR(191) NULL,
    ADD COLUMN `nomeSolicitante` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `AtendimentoMobuss_cpfCnpjCliente_idx` ON `AtendimentoMobuss`(`cpfCnpjCliente`);
