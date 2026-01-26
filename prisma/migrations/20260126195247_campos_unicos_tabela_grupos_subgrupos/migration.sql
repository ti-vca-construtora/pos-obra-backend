/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `grupo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nome]` on the table `subgrupo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `grupo_nome_key` ON `grupo`(`nome`);

-- CreateIndex
CREATE UNIQUE INDEX `subgrupo_nome_key` ON `subgrupo`(`nome`);
