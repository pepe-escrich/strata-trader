import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedLevel, SavedLevelDocument } from './schemas/saved-level.schema';
import { SaveLevelDto, SaveLevelsDto } from './dto/save-level.dto';
import { GetSavedLevelsDto } from './dto/get-saved-levels.dto';
import { StrengthCalculatorService } from './strength-calculator.service';

@Injectable()
export class LevelsService {
  private readonly logger = new Logger(LevelsService.name);

  constructor(
    @InjectModel(SavedLevel.name)
    private readonly levelModel: Model<SavedLevelDocument>,
    private readonly strengthCalculator: StrengthCalculatorService,
  ) {}

  /**
   * Save multiple levels at once
   */
  async saveLevels(dto: SaveLevelsDto): Promise<SavedLevelDocument[]> {
    this.logger.log(`Saving ${dto.levels.length} levels`);

    const savedLevels: SavedLevelDocument[] = [];

    // Group levels by symbol and interval for efficient strength calculation
    const levelsBySymbolInterval = new Map<string, SaveLevelDto[]>();

    dto.levels.forEach(level => {
      const key = `${level.symbol}_${level.interval}`;
      if (!levelsBySymbolInterval.has(key)) {
        levelsBySymbolInterval.set(key, []);
      }
      levelsBySymbolInterval.get(key).push(level);
    });

    // Calculate strength for each group
    for (const [key, levels] of levelsBySymbolInterval.entries()) {
      const [symbol, interval] = key.split('_');

      // Calculate touches for all levels in this group at once
      const touchResults = await this.strengthCalculator.calculateTouchesForMultipleLevels(
        symbol,
        levels.map(l => ({ price: l.price })),
        interval,
      );

      // Save each level with calculated strength
      for (const levelDto of levels) {
        const touchResult = touchResults.get(levelDto.price) || { touchCount: 0, strength: 0 };

        const levelToSave = new this.levelModel({
          ...levelDto,
          touchCount: touchResult.touchCount,
          strength: touchResult.strength,
          lastTouchCalculation: new Date(),
        });

        const saved = await levelToSave.save();
        savedLevels.push(saved);

        this.logger.log(
          `Saved level ${levelDto.label} at ${levelDto.price} for ${symbol} (strength: ${touchResult.strength})`,
        );
      }
    }

    return savedLevels;
  }

  /**
   * Get all saved levels for a symbol with optional filters
   */
  async getSavedLevels(
    symbol: string,
    filters?: GetSavedLevelsDto,
  ): Promise<SavedLevelDocument[]> {
    const query: any = { symbol };

    if (filters?.calculationMethod) {
      query.calculationMethod = filters.calculationMethod;
    }
    if (filters?.interval) {
      query.interval = filters.interval;
    }
    if (filters?.type) {
      query.type = filters.type;
    }

    this.logger.log(`Getting saved levels for ${symbol} with filters: ${JSON.stringify(filters)}`);

    const levels = await this.levelModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();

    this.logger.log(`Found ${levels.length} saved levels for ${symbol}`);

    return levels;
  }

  /**
   * Delete a saved level by ID
   */
  async deleteLevel(id: string): Promise<void> {
    this.logger.log(`Deleting level with ID: ${id}`);

    const result = await this.levelModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }

    this.logger.log(`Level ${id} deleted successfully`);
  }

  /**
   * Recalculate strength for all levels of a symbol
   */
  async recalculateStrength(symbol: string): Promise<void> {
    this.logger.log(`Recalculating strength for all levels of ${symbol}`);

    const levels = await this.levelModel.find({ symbol }).exec();

    if (levels.length === 0) {
      this.logger.warn(`No levels found for ${symbol}`);
      return;
    }

    // Group by interval for efficient calculation
    const levelsByInterval = new Map<string, SavedLevelDocument[]>();
    levels.forEach(level => {
      if (!levelsByInterval.has(level.interval)) {
        levelsByInterval.set(level.interval, []);
      }
      levelsByInterval.get(level.interval).push(level);
    });

    // Recalculate for each interval group
    for (const [interval, intervalLevels] of levelsByInterval.entries()) {
      const touchResults = await this.strengthCalculator.calculateTouchesForMultipleLevels(
        symbol,
        intervalLevels.map(l => ({ price: l.price })),
        interval,
      );

      // Update each level
      for (const level of intervalLevels) {
        const touchResult = touchResults.get(level.price) || { touchCount: 0, strength: 0 };

        level.touchCount = touchResult.touchCount;
        level.strength = touchResult.strength;
        level.lastTouchCalculation = new Date();

        await level.save();
      }
    }

    this.logger.log(`Strength recalculated for ${levels.length} levels of ${symbol}`);
  }

  /**
   * Delete multiple levels by IDs
   */
  async deleteLevels(ids: string[]): Promise<void> {
    this.logger.log(`Deleting ${ids.length} levels`);

    const result = await this.levelModel.deleteMany({ _id: { $in: ids } }).exec();

    this.logger.log(`Deleted ${result.deletedCount} levels`);
  }
}
