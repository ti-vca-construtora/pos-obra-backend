// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MobussModule } from '../integracoes/mobuss/mobuss.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { HuggyModule } from 'src/integracoes/huggy/huggy.module';
import { TasksController } from './tasks.controller';

@Module({
  imports: [PrismaModule, MobussModule, EmailModule, HuggyModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
