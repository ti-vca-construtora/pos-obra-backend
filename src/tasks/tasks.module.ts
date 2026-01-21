// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MobussModule } from '../integracoes/mobuss/mobuss.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MobussModule],
  providers: [TasksService],
})
export class TasksModule {}
