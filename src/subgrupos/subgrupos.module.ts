import { Module } from '@nestjs/common';
import { SubgruposController } from './subgrupos.controller';
import { SubgruposService } from './subgrupos.service';

@Module({
  imports:[SubgruposModule],
  controllers: [SubgruposController],
  providers: [SubgruposService]
})
export class SubgruposModule {}
