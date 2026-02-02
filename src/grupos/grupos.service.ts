import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GruposService {
  constructor(private prisma: PrismaService) {}

async create(dto: CreateGrupoDto) {
  try {
    return await this.prisma.grupo.create({
      data: dto,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Grupo com esse nome já existe');
    }
    throw error;
  }
}

  findAll() {
  return this.prisma.grupo.findMany({   
    include: { subgrupos: true },
  });
}


  findOne(id: number) {
    return this.prisma.grupo.findUnique({
      where: { id },
    });
  }

  update(id: number, dto: UpdateGrupoDto) {
    return this.prisma.grupo.update({
      where: { id },
      data: dto,
    });
  }

  findAllWithSubgrupos() {
  return this.prisma.grupo.findMany({
    where: { status: true },
    include: {
      subgrupos: {
        where: { status: true },
        orderBy: { nome: 'asc' },
      },
    },
    orderBy: { nome: 'asc' },
  });
}


async remove(id: number) {
  return this.prisma.grupo.update({
    where: { id },
    data: {
      status: false,
    },
  });
}

}
