import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MobussController } from './mobuss.controller';
import { MobussService } from './mobuss.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
    }),
  ],
  controllers: [MobussController],
  providers: [MobussService],
  exports: [MobussService],
})
export class MobussModule {}

