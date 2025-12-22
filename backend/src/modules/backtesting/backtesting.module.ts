import { Module } from '@nestjs/common';
import { BacktestingService } from './backtesting.service';
import { BacktestingController } from './backtesting.controller';

@Module({
  providers: [BacktestingService],
  controllers: [BacktestingController]
})
export class BacktestingModule {}
