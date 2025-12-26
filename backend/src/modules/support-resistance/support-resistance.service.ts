import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketService } from '../market/market.service';
import { PivotPointsCalculator } from './calculators/pivot-points.calculator';
import { SwingLevelsCalculator } from './calculators/swing-levels.calculator';
import { VolumeProfileCalculator } from './calculators/volume-profile.calculator';
import { Level, CalculationMethod, LevelStatus, CalculatorResult } from './entities/level.entity';
import { Candle } from '../bingx/interfaces/bingx-response.interface';
import { v4 as uuidv4 } from 'uuid';

interface LevelCache {
  levels: Level[];
  timestamp: number;
  ttl: number;
}

@Injectable()
export class SupportResistanceService {
  private readonly logger = new Logger(SupportResistanceService.name);
  private readonly levelCache = new Map<string, LevelCache>();
  private readonly cacheTTL: number;
  private readonly minLevelStrength: number;

  constructor(
    private readonly marketService: MarketService,
    private readonly pivotCalculator: PivotPointsCalculator,
    private readonly swingCalculator: SwingLevelsCalculator,
    private readonly volumeCalculator: VolumeProfileCalculator,
    private readonly configService: ConfigService,
  ) {
    this.cacheTTL = this.configService.get<number>('trading.levels.updateInterval', 60000);
    this.minLevelStrength = this.configService.get<number>('trading.levels.minStrength', 40);
    this.logger.log(`Support-Resistance Service initialized - Cache TTL: ${this.cacheTTL}ms`);
  }

  /**
   * Calculate all levels for a symbol
   */
  async calculateLevels(
    symbol: string,
    timeframe: string = '1h',
    config?: {
      minStrength?: number;
      maxLevels?: number;
    },
  ): Promise<Level[]> {
    this.logger.debug(`Calculating levels for ${symbol} ${timeframe}`);

    // Get candle data
    const candles = await this.marketService.getCandles(symbol, timeframe, 200);

    if (candles.length < 10) {
      this.logger.warn(`Not enough candles for ${symbol} ${timeframe}`);
      return [];
    }

    const currentPrice = candles[candles.length - 1].close;
    const allLevels: Level[] = [];

    // Calculate using all methods
    const results: Array<{ result: CalculatorResult; method: CalculationMethod[] }> = [
      {
        result: this.pivotCalculator.calculateStandard(candles),
        method: [CalculationMethod.PIVOT_STANDARD],
      },
      {
        result: this.pivotCalculator.calculateFibonacci(candles),
        method: [CalculationMethod.PIVOT_FIBONACCI],
      },
      {
        result: this.pivotCalculator.calculateCamarilla(candles),
        method: [CalculationMethod.PIVOT_CAMARILLA],
      },
      {
        result: this.swingCalculator.calculate(candles),
        method: [CalculationMethod.SWING_HIGH_LOW],
      },
      {
        result: this.volumeCalculator.calculate(candles),
        method: [
          CalculationMethod.VOLUME_PROFILE_POC,
          CalculationMethod.VOLUME_PROFILE_VAH,
          CalculationMethod.VOLUME_PROFILE_VAL,
        ],
      },
    ];

    // Convert all results to Level objects
    results.forEach(({ result, method }) => {
      // Add supports
      result.supports.forEach((price, index) => {
        const level = this.createLevel({
          symbol,
          price,
          type: 'SUPPORT',
          timeframe,
          method: method[0], // Use first method
          currentPrice,
          candles,
          metadata: result.metadata,
        });
        allLevels.push(level);
      });

      // Add resistances
      result.resistances.forEach((price, index) => {
        const level = this.createLevel({
          symbol,
          price,
          type: 'RESISTANCE',
          timeframe,
          method: method[0],
          currentPrice,
          candles,
          metadata: result.metadata,
        });
        allLevels.push(level);
      });
    });

    // Group similar levels and calculate confluence
    const grouped = this.groupSimilarLevels(allLevels);

    // Calculate strength for each level
    grouped.forEach((level) => {
      level.strength = this.calculateStrength(level, candles, currentPrice);
    });

    // Filter by minimum strength
    const minStrength = config?.minStrength || this.minLevelStrength;
    const filtered = grouped.filter((l) => l.strength >= minStrength);

    // Sort by strength (strongest first)
    filtered.sort((a, b) => b.strength - a.strength);

    // Limit number of levels if specified
    const maxLevels = config?.maxLevels || filtered.length;
    const limited = filtered.slice(0, maxLevels);

    this.logger.debug(`Found ${limited.length} levels for ${symbol} ${timeframe}`);

    return limited;
  }

  /**
   * Create a Level object
   */
  private createLevel(params: {
    symbol: string;
    price: number;
    type: 'SUPPORT' | 'RESISTANCE';
    timeframe: string;
    method: CalculationMethod;
    currentPrice: number;
    candles: Candle[];
    metadata?: Record<string, any>;
  }): Level {
    const { symbol, price, type, timeframe, method, currentPrice, candles, metadata } = params;

    // Calculate touches
    const touches = this.countTouches(price, candles);

    // Determine status
    let status: LevelStatus = LevelStatus.ACTIVE;
    if (type === 'SUPPORT' && currentPrice < price) {
      status = LevelStatus.BROKEN;
    } else if (type === 'RESISTANCE' && currentPrice > price) {
      status = LevelStatus.BROKEN;
    }

    return {
      id: uuidv4(),
      symbol,
      price,
      type,
      timeframe,
      method,
      strength: 0, // Will be calculated later
      touches,
      status,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Group similar levels (within tolerance)
   */
  private groupSimilarLevels(levels: Level[], tolerance: number = 0.005): Level[] {
    if (levels.length === 0) return [];

    const grouped: Level[] = [];
    const sorted = [...levels].sort((a, b) => a.price - b.price);

    let currentGroup: Level[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prevPrice = currentGroup[0].price;
      const currentPrice = sorted[i].price;

      // Check if within tolerance (0.5% by default)
      if (Math.abs(currentPrice - prevPrice) / prevPrice <= tolerance) {
        currentGroup.push(sorted[i]);
      } else {
        // Create merged level
        grouped.push(this.mergeLevels(currentGroup));
        currentGroup = [sorted[i]];
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      grouped.push(this.mergeLevels(currentGroup));
    }

    return grouped;
  }

  /**
   * Merge multiple levels into one (confluence)
   */
  private mergeLevels(levels: Level[]): Level {
    if (levels.length === 1) return levels[0];

    // Average price weighted by touches
    const totalTouches = levels.reduce((sum, l) => sum + l.touches, 0);
    const avgPrice =
      levels.reduce((sum, l) => sum + l.price * l.touches, 0) / totalTouches;

    // Use the most common type
    const typeCount = levels.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const type = (Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a])[0] as 'SUPPORT' | 'RESISTANCE');

    return {
      ...levels[0],
      price: avgPrice,
      type,
      touches: totalTouches,
      metadata: {
        ...levels[0].metadata,
        confluence: levels.length,
        methods: levels.map((l) => l.method),
      },
    };
  }

  /**
   * Calculate strength of a level (0-100)
   */
  private calculateStrength(level: Level, candles: Candle[], currentPrice: number): number {
    let strength = 0;

    // Factor 1: Number of touches (max 30 points)
    const touchScore = Math.min(level.touches * 10, 30);
    strength += touchScore;

    // Factor 2: Confluence (multiple methods agree) (max 30 points)
    const confluence = level.metadata?.confluence || 1;
    const confluenceScore = Math.min(confluence * 10, 30);
    strength += confluenceScore;

    // Factor 3: Recent test (max 20 points)
    const recentTestScore = this.calculateRecentTestScore(level.price, candles);
    strength += recentTestScore;

    // Factor 4: Distance from current price (max 10 points)
    const distance = Math.abs(currentPrice - level.price) / currentPrice;
    const distanceScore = distance < 0.01 ? 10 : distance < 0.02 ? 5 : 0;
    strength += distanceScore;

    // Factor 5: Level not broken (max 10 points)
    const statusScore = level.status === LevelStatus.ACTIVE ? 10 : 0;
    strength += statusScore;

    return Math.min(Math.round(strength), 100);
  }

  /**
   * Calculate score based on recent tests of the level
   */
  private calculateRecentTestScore(price: number, candles: Candle[]): number {
    const recentCandles = candles.slice(-20); // Last 20 candles
    const tolerance = price * 0.002; // 0.2% tolerance

    let testCount = 0;
    for (const candle of recentCandles) {
      if (
        Math.abs(candle.high - price) <= tolerance ||
        Math.abs(candle.low - price) <= tolerance
      ) {
        testCount++;
      }
    }

    return Math.min(testCount * 5, 20);
  }

  /**
   * Count how many times price touched the level
   */
  private countTouches(price: number, candles: Candle[]): number {
    const tolerance = price * 0.002; // 0.2% tolerance
    let touches = 0;

    for (const candle of candles) {
      if (
        Math.abs(candle.high - price) <= tolerance ||
        Math.abs(candle.low - price) <= tolerance ||
        (candle.low <= price && candle.high >= price)
      ) {
        touches++;
      }
    }

    return touches;
  }

  /**
   * Get levels with caching
   */
  async getLevels(
    symbol: string,
    timeframe: string = '1h',
    options?: { useCache?: boolean; minStrength?: number },
  ): Promise<Level[]> {
    const useCache = options?.useCache !== false;
    const cacheKey = `${symbol}_${timeframe}`;

    // Check cache
    if (useCache) {
      const cached = this.levelCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached.levels;
      }
    }

    // Calculate fresh levels
    const levels = await this.calculateLevels(symbol, timeframe, {
      minStrength: options?.minStrength,
    });

    // Cache results
    this.levelCache.set(cacheKey, {
      levels,
      timestamp: Date.now(),
      ttl: this.cacheTTL,
    });

    return levels;
  }

  /**
   * Get nearby levels (within distance from current price)
   */
  async getNearbyLevels(
    symbol: string,
    timeframe: string = '1h',
    distancePercent: number = 0.5,
  ): Promise<Level[]> {
    const levels = await this.getLevels(symbol, timeframe);
    const ticker = await this.marketService.getTicker(symbol);
    const currentPrice = ticker.price;

    return levels.filter((level) => {
      const distance = Math.abs(level.price - currentPrice) / currentPrice;
      return distance <= distancePercent / 100;
    });
  }

  /**
   * Get levels for multiple timeframes
   */
  async getMultiTimeframeLevels(
    symbol: string,
    timeframes: string[] = ['15m', '1h', '4h', '1d'],
  ): Promise<Map<string, Level[]>> {
    const results = new Map<string, Level[]>();

    for (const timeframe of timeframes) {
      const levels = await this.getLevels(symbol, timeframe);
      results.set(timeframe, levels);
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      // Clear only for specific symbol
      for (const key of this.levelCache.keys()) {
        if (key.startsWith(symbol)) {
          this.levelCache.delete(key);
        }
      }
      this.logger.log(`Cache cleared for ${symbol}`);
    } else {
      // Clear all
      this.levelCache.clear();
      this.logger.log('All level cache cleared');
    }
  }
}
