import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AtendimentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(cpfCnpj?: string) {
    return this.prisma.atendimentoMobuss.findMany({
      where: cpfCnpj
        ? {
            cpfCnpjCliente: cpfCnpj,
          }
        : undefined,

      include: {
        agendamento: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.atendimentoMobuss.findUnique({
      where: { id },
      include: {
        agendamento: true,
      },
    });
  }
}
