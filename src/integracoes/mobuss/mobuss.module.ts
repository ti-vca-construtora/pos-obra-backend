import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MobussController } from './mobuss.controller';
import { MobussService } from './mobuss.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
    }),
    EmailModule
  ],
  controllers: [MobussController],
  providers: [MobussService],
  exports: [MobussService],
})
export class MobussModule {}

