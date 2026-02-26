import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TermoService {

  constructor(
    private prisma: PrismaService
  ) {}



  async getTermo() {

    let termo =
      await this.prisma.termoSite.findUnique({

        where: { id: 1 }

      });


    if (!termo) {

      termo =
        await this.prisma.termoSite.create({

          data: {

            id: 1,

            conteudo: ''

          }

        });

    }


    return termo;

  }




  async salvarTermo(conteudo: string) {

    return this.prisma.termoSite.upsert({

      where: { id: 1 },

      update: {

        conteudo

      },

      create: {

        id: 1,

        conteudo

      }

    });

  }



}