import { Module } from '@nestjs/common';
import { HuggyService } from './huggy.service';

@Module({
  providers: [HuggyService],
  exports: [HuggyService], // 🔥 MUITO IMPORTANTE
})
export class HuggyModule {}