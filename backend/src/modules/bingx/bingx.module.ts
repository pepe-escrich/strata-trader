import { Module } from '@nestjs/common';
import { BingxService } from './bingx.service';

@Module({
  providers: [BingxService]
})
export class BingxModule {}
