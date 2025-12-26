import { Controller, Get, Post, Delete, Query, Param, Logger, Body } from '@nestjs/common';
import { SupportResistanceService } from './support-resistance.service';
import { CalculateLevelsDto, GetNearbyLevelsDto } from './dto/calculate-levels.dto';

@Controller('levels')
export class SupportResistanceController {
  private readonly logger = new Logger(SupportResistanceController.name);

  constructor(private readonly supportResistanceService: SupportResistanceService) {}

  /**
   * GET /api/levels/:symbol
   * Get calculated support and resistance levels for a symbol
   */
  @Get(':symbol')
  async getLevels(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe?: string,
    @Query('minStrength') minStrength?: number,
  ) {
    this.logger.log(`GET /api/levels/${symbol} - Timeframe: ${timeframe || '1h'}`);

    const levels = await this.supportResistanceService.getLevels(symbol, timeframe || '1h', {
      minStrength: minStrength ? Number(minStrength) : undefined,
    });

    return {
      symbol,
      timeframe: timeframe || '1h',
      count: levels.length,
      levels,
    };
  }

  /**
   * POST /api/levels/calculate
   * Calculate levels (force recalculation, bypass cache)
   */
  @Post('calculate')
  async calculateLevels(@Body() dto: CalculateLevelsDto) {
    this.logger.log(`POST /api/levels/calculate - ${dto.symbol}`);

    const results: Record<string, any> = {};

    for (const timeframe of dto.timeframes || ['1h']) {
      const levels = await this.supportResistanceService.getLevels(dto.symbol, timeframe, {
        useCache: false,
        minStrength: dto.minStrength,
      });

      results[timeframe] = {
        count: levels.length,
        levels,
      };
    }

    return {
      symbol: dto.symbol,
      timeframes: Object.keys(results),
      results,
    };
  }

  /**
   * GET /api/levels/nearby/:symbol
   * Get levels nearby current price
   */
  @Get('nearby/:symbol')
  async getNearbyLevels(
    @Param('symbol') symbol: string,
    @Query() query: GetNearbyLevelsDto,
  ) {
    this.logger.log(`GET /api/levels/nearby/${symbol} - Distance: ${query.distancePercent || 0.5}%`);

    const levels = await this.supportResistanceService.getNearbyLevels(
      symbol,
      query.timeframe || '1h',
      query.distancePercent || 0.5,
    );

    return {
      symbol,
      timeframe: query.timeframe || '1h',
      distancePercent: query.distancePercent || 0.5,
      count: levels.length,
      levels,
    };
  }

  /**
   * GET /api/levels/strength/:symbol
   * Get level strength analysis
   */
  @Get('strength/:symbol')
  async getLevelStrength(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe?: string,
  ) {
    this.logger.log(`GET /api/levels/strength/${symbol}`);

    const levels = await this.supportResistanceService.getLevels(symbol, timeframe || '1h');

    // Group by strength category
    const strong = levels.filter((l) => l.strength >= 70);
    const medium = levels.filter((l) => l.strength >= 40 && l.strength < 70);
    const weak = levels.filter((l) => l.strength < 40);

    // Separate supports and resistances
    const supports = levels.filter((l) => l.type === 'SUPPORT');
    const resistances = levels.filter((l) => l.type === 'RESISTANCE');

    return {
      symbol,
      timeframe: timeframe || '1h',
      total: levels.length,
      byStrength: {
        strong: { count: strong.length, levels: strong },
        medium: { count: medium.length, levels: medium },
        weak: { count: weak.length, levels: weak },
      },
      byType: {
        supports: { count: supports.length, levels: supports },
        resistances: { count: resistances.length, levels: resistances },
      },
    };
  }

  /**
   * GET /api/levels/multi-timeframe/:symbol
   * Get levels across multiple timeframes
   */
  @Get('multi-timeframe/:symbol')
  async getMultiTimeframeLevels(
    @Param('symbol') symbol: string,
    @Query('timeframes') timeframes?: string,
  ) {
    this.logger.log(`GET /api/levels/multi-timeframe/${symbol}`);

    const timeframeList = timeframes ? timeframes.split(',') : ['15m', '1h', '4h', '1d'];
    const results = await this.supportResistanceService.getMultiTimeframeLevels(symbol, timeframeList);

    // Convert Map to object for JSON serialization
    const data: Record<string, any> = {};
    results.forEach((levels, tf) => {
      data[tf] = {
        count: levels.length,
        levels,
      };
    });

    return {
      symbol,
      timeframes: timeframeList,
      results: data,
    };
  }

  /**
   * DELETE /api/levels/cache
   * Clear level cache
   */
  @Delete('cache')
  async clearCache() {
    this.logger.log('DELETE /api/levels/cache');
    this.supportResistanceService.clearCache();
    return { message: 'Level cache cleared successfully' };
  }

  /**
   * DELETE /api/levels/cache/:symbol
   * Clear cache for specific symbol
   */
  @Delete('cache/:symbol')
  async clearSymbolCache(@Param('symbol') symbol: string) {
    this.logger.log(`DELETE /api/levels/cache/${symbol}`);
    this.supportResistanceService.clearCache(symbol);
    return { message: `Cache cleared for ${symbol}` };
  }
}
