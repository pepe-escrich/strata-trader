import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { StrengthCalculatorService } from './strength-calculator.service';
import { FrvpService } from './frvp.service';
import { SavedLevel, SavedLevelSchema } from './schemas/saved-level.schema';
import { BingxModule } from '../bingx/bingx.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedLevel.name, schema: SavedLevelSchema },
    ]),
    BingxModule, // Import BingxModule to use BingxService
  ],
  controllers: [LevelsController],
  providers: [LevelsService, StrengthCalculatorService, FrvpService],
  exports: [LevelsService, FrvpService],
})
export class LevelsModule {}
