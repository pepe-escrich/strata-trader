import { Controller, Get, Query } from '@nestjs/common';
import { TaapiService } from './taapi.service';
import { GetLevelsDto, LevelType } from './dto/get-levels.dto';
import { LevelsResponse } from './interfaces/levels.interface';

@Controller('levels')
export class LevelsController {
  constructor(private readonly taapiService: TaapiService) {}

  @Get()
  async getLevels(@Query() dto: GetLevelsDto): Promise<LevelsResponse> {
    const { symbol, interval, type, exchange } = dto;

    let data: any;

    switch (type) {
      case LevelType.PIVOT:
        data = await this.taapiService.getPivotPoints(
          symbol,
          interval,
          exchange,
        );
        break;

      case LevelType.FIBONACCI:
        data = await this.taapiService.getFibonacciRetracement(
          symbol,
          interval,
          exchange,
        );
        break;

      case LevelType.ICHIMOKU:
        data = await this.taapiService.getIchimokuCloud(
          symbol,
          interval,
          exchange,
        );
        break;

      default:
        throw new Error(`Unknown level type: ${type}`);
    }

    return {
      symbol,
      interval,
      type,
      data,
      timestamp: Date.now(),
    };
  }
}
