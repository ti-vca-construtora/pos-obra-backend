import { Module } from '@nestjs/common';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExamplesModule } from './examples/examples.module';
import { MotivosModule } from './motivos/motivos.module';
import { GruposModule } from './grupos/grupos.module';
import { SubgruposModule } from './subgrupos/subgrupos.module';
import { MobussModule } from './integracoes/mobuss/mobuss.module';

import {ScheduleModule} from '@nestjs/schedule';
import { TasksService } from './tasks/tasks.service';
import { TasksModule } from './tasks/tasks.module';
import { AtendimentosModule } from './atendimentos/atendimentos.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    UsersModule, 
    AuthModule, 
    PrismaModule, 
    ExamplesModule, 
    MotivosModule, 
    GruposModule, 
    SubgruposModule, 
    MobussModule,
    ScheduleModule.forRoot(),
    TasksModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/docs',
    }),
    AtendimentosModule,   
    EmailModule, 
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, TasksService],
})
export class AppModule {}
