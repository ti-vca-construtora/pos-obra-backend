// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MobussModule } from '../integracoes/mobuss/mobuss.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [PrismaModule, MobussModule, EmailModule],
  providers: [TasksService],
})
export class TasksModule {}
