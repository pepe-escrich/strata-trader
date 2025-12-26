import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.module';
import { SupportResistanceService } from './support-resistance.service';
import { SupportResistanceController } from './support-resistance.controller';
import { PivotPointsCalculator } from './calculators/pivot-points.calculator';
import { SwingLevelsCalculator } from './calculators/swing-levels.calculator';
import { VolumeProfileCalculator } from './calculators/volume-profile.calculator';

@Module({
  imports: [MarketModule],
  providers: [
    SupportResistanceService,
    PivotPointsCalculator,
    SwingLevelsCalculator,
    VolumeProfileCalculator,
  ],
  controllers: [SupportResistanceController],
  exports: [SupportResistanceService],
})
export class SupportResistanceModule {}
