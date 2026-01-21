import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMotivoDto } from './dto/create-motivo.dto';
import { UpdateMotivoDto } from './dto/update-motivo.dto';

@Injectable()
export class MotivosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMotivoDto) {
    return this.prisma.motivo.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.motivo.findMany({
      orderBy: { descricao: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.motivo.findUnique({
      where: { id },
    });
  }

  update(id: number, dto: UpdateMotivoDto) {
    return this.prisma.motivo.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    // soft delete
    return this.prisma.motivo.update({
      where: { id },
      data: { status: false },
    });
  }
}
