import { Module } from '@nestjs/common';
import { DivergenceService } from './divergence.service';
import { DivergenceController } from './divergence.controller';

@Module({
  providers: [DivergenceService],
  controllers: [DivergenceController]
})
export class DivergenceModule {}
