import { Module } from '@nestjs/common';
import { TermoService } from './termo.service';
import { TermoController } from './termo.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({

  controllers: [TermoController],

  providers: [
    TermoService,
    PrismaService
  ],

})

export class TermoModule {}