import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BingxService } from './bingx.service';
import { MarketController } from './market.controller';
import { MarketGateway } from './market.gateway';

@Module({
  imports: [HttpModule],
  controllers: [MarketController],
  providers: [BingxService, MarketGateway],
  exports: [BingxService],
})
export class BingxModule {}
