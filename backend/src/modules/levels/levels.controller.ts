import { Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { FrvpService } from './frvp.service';
import { SaveLevelsDto } from './dto/save-level.dto';
import { GetSavedLevelsDto } from './dto/get-saved-levels.dto';
import { CalculateFrvpDto } from './dto/calculate-frvp.dto';

@Controller('levels')
export class LevelsController {
  constructor(
    private readonly levelsService: LevelsService,
    private readonly frvpService: FrvpService,
  ) {}

  /**
   * Save selected levels
   * POST /api/levels/save
   */
  @Post('save')
  @HttpCode(HttpStatus.CREATED)
  async saveLevels(@Body() dto: SaveLevelsDto) {
    return await this.levelsService.saveLevels(dto);
  }

  /**
   * Get all saved levels for a symbol
   * GET /api/levels/saved/:symbol
   */
  @Get('saved/:symbol')
  async getSavedLevels(
    @Param('symbol') symbol: string,
    @Query() filters?: GetSavedLevelsDto,
  ) {
    return await this.levelsService.getSavedLevels(symbol, filters);
  }

  /**
   * Delete a saved level
   * DELETE /api/levels/saved/:id
   */
  @Delete('saved/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLevel(@Param('id') id: string) {
    await this.levelsService.deleteLevel(id);
  }

  /**
   * Recalculate strength for all levels of a symbol
   * POST /api/levels/recalculate-strength/:symbol
   */
  @Post('recalculate-strength/:symbol')
  @HttpCode(HttpStatus.OK)
  async recalculateStrength(@Param('symbol') symbol: string) {
    await this.levelsService.recalculateStrength(symbol);
    return { message: `Strength recalculated for ${symbol}` };
  }

  /**
   * Calculate Fixed Range Volume Profile
   * POST /api/levels/frvp
   */
  @Post('frvp')
  @HttpCode(HttpStatus.OK)
  async calculateFrvp(@Body() dto: CalculateFrvpDto) {
    return await this.frvpService.calculateFrvp(dto);
  }
}
