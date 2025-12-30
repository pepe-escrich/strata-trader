import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BingxService } from './bingx.service';
import { MarketController } from './market.controller';

@Module({
  imports: [HttpModule],
  controllers: [MarketController],
  providers: [BingxService],
  exports: [BingxService],
})
export class BingxModule {}
