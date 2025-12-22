import { Module } from '@nestjs/common';
import { BingxModule } from '../bingx/bingx.module';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';

@Module({
  imports: [BingxModule],
  providers: [MarketService],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}
