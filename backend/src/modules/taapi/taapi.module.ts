import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TaapiService } from './taapi.service';
import { LevelsController } from './levels.controller';
import taapiConfig from '../../config/taapi.config';

@Module({
  imports: [HttpModule, ConfigModule.forFeature(taapiConfig)],
  controllers: [LevelsController],
  providers: [TaapiService],
  exports: [TaapiService],
})
export class TaapiModule {}
