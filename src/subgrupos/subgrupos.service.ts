import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubgrupoDto } from './dto/create-subgrupo.dto';
import { UpdateSubgrupoDto } from './dto/update-subgrupo.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubgruposService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateSubgrupoDto) {
  const grupo = await this.prisma.grupo.findUnique({
    where: { id: dto.grupoId },
  });

  if (!grupo || !grupo.status) {
    throw new BadRequestException('Grupo inválido ou inativo');
  }

  try {
    return await this.prisma.subgrupo.create({
      data: dto,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Já existe um subgrupo com esse nome',
      );
    }

    throw error;
  }
}

  findAll() {
    return this.prisma.subgrupo.findMany({
      include: {
        grupo: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.subgrupo.findUnique({
      where: { id },
      include: { grupo: true },
    });
  }

  findByGrupo(grupoId: number) {
    return this.prisma.subgrupo.findMany({
      where: { grupoId },
      orderBy: { nome: 'asc' },
    });
  }

  update(id: number, dto: UpdateSubgrupoDto) {
    return this.prisma.subgrupo.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    // soft delete
    return this.prisma.subgrupo.update({
      where: { id },
      data: { status: false },
    });
  }
}
