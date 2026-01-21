-- CreateTable
CREATE TABLE `AtendimentoMobuss` (
    `id` VARCHAR(191) NOT NULL,
    `idMobuss` VARCHAR(191) NOT NULL,
    `numSolicitacao` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `payloadEnvio` JSON NOT NULL,
    `payloadResposta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AtendimentoMobuss_idMobuss_key`(`idMobuss`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgendamentoMobuss` (
    `id` VARCHAR(191) NOT NULL,
    `idVisita` VARCHAR(191) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NOT NULL,
    `idColaborador` VARCHAR(191) NOT NULL,
    `atendimentoId` VARCHAR(191) NOT NULL,
    `payloadEnvio` JSON NOT NULL,
    `payloadResposta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AgendamentoMobuss_idVisita_key`(`idVisita`),
    UNIQUE INDEX `AgendamentoMobuss_atendimentoId_key`(`atendimentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AgendamentoMobuss` ADD CONSTRAINT `AgendamentoMobuss_atendimentoId_fkey` FOREIGN KEY (`atendimentoId`) REFERENCES `AtendimentoMobuss`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
