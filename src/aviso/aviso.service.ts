import {
  Injectable,
  NotFoundException
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';

@Injectable()
export class AvisoService {

  constructor(
    private prisma: PrismaService
  ) {}



  async listar() {

    return this.prisma.avisoSite.findMany({

      orderBy: {
        createdAt: 'desc'
      }

    });

  }



  async obterAtivo() {

    const agora = new Date();

    return this.prisma.avisoSite.findFirst({

      where: {

        ativo: true,

        dataInicio: {

          lte: agora

        },

        dataFim: {

          gte: agora

        }

      }

    });

  }



  async criar(dto: CreateAvisoDto) {

    if (dto.ativo) {

      await this.prisma.avisoSite.updateMany({

        data: {

          ativo: false

        }

      });

    }


    return this.prisma.avisoSite.create({

      data: dto

    });

  }



  async atualizar(
    id: string,
    dto: UpdateAvisoDto
  ) {

    const aviso =
      await this.prisma.avisoSite.findUnique({

        where: { id }

      });


    if (!aviso) {

      throw new NotFoundException(
        'Aviso não encontrado'
      );

    }



    if (dto.ativo) {

      await this.prisma.avisoSite.updateMany({

        where: {

          NOT: { id }

        },

        data: {

          ativo: false

        }

      });

    }



    return this.prisma.avisoSite.update({

      where: { id },

      data: dto

    });

  }



}