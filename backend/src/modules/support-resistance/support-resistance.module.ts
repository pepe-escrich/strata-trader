import { Module } from '@nestjs/common';
import { SupportResistanceService } from './support-resistance.service';
import { SupportResistanceController } from './support-resistance.controller';

@Module({
  providers: [SupportResistanceService],
  controllers: [SupportResistanceController]
})
export class SupportResistanceModule {}
