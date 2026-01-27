import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    let retries = 5;

    while (retries > 0) {
      try {
        await this.$connect();
        //console.log(' Prisma conectado ao banco');
        return;
      } catch (err) {
        retries--;
        console.log(`⏳ Aguardando banco... (${retries})`);
        await new Promise((res) => setTimeout(res, 3000));
      }
    }

    throw new Error('❌ Não foi possível conectar ao banco');
  }

  async enableShutdownHooks() {
    await this.$disconnect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
