import { Module } from '@nestjs/common';
import { MotivosController } from './motivos.controller';
import { MotivosService } from './motivos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MotivosController],
  providers: [MotivosService],
})
export class MotivosModule {}
