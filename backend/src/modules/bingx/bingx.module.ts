import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BingxService } from './bingx.service';

@Module({
  imports: [HttpModule],
  providers: [BingxService],
  exports: [BingxService],
})
export class BingxModule {}
