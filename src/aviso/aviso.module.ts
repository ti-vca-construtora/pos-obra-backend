import { Module } from '@nestjs/common';

import { AvisoService } from './aviso.service';
import { AvisoController } from './aviso.controller';

import { PrismaService } from '../prisma/prisma.service';

@Module({

  controllers: [AvisoController],

  providers: [
    AvisoService,
    PrismaService
  ],

})

export class AvisoModule {}