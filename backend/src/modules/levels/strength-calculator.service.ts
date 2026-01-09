import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BingxService } from '../bingx/bingx.service';
import { Candle } from '../bingx/interfaces/bingx-response.interface';

interface TouchCalculationResult {
  touchCount: number;
  strength: number;
}

@Injectable()
export class StrengthCalculatorService {
  private readonly logger = new Logger(StrengthCalculatorService.name);
  private readonly candlesLimit: number;
  private readonly touchThreshold: number;
  private readonly cacheTTL: number;

  // Simple cache to avoid redundant API calls
  private candleCache: Map<string, { data: Candle[]; timestamp: number }> = new Map();

  constructor(
    private readonly bingxService: BingxService,
    private readonly configService: ConfigService,
  ) {
    this.candlesLimit = this.configService.get<number>('levels.strengthCalculation.candles') || 500;
    this.touchThreshold = this.configService.get<number>('levels.strengthCalculation.threshold') || 0.001;
    this.cacheTTL = this.configService.get<number>('levels.strengthCalculation.cacheTTL') || 3600000; // 1 hour
  }

  /**
   * Calculate touches and strength for a single level
   */
  async calculateTouches(
    symbol: string,
    levelPrice: number,
    interval: string,
  ): Promise<TouchCalculationResult> {
    try {
      // Get historical candles
      const candles = await this.getHistoricalCandles(symbol, interval);

      if (candles.length === 0) {
        this.logger.warn(`No candles available for ${symbol} ${interval}`);
        return { touchCount: 0, strength: 0 };
      }

      // Count touches
      let touchCount = 0;
      for (const candle of candles) {
        if (this.isTouched(candle, levelPrice, this.touchThreshold)) {
          touchCount++;
        }
      }

      // Calculate strength score (0-100)
      const strength = this.calculateStrength(touchCount, candles.length);

      this.logger.log(
        `Level ${levelPrice} for ${symbol} ${interval}: ${touchCount} touches out of ${candles.length} candles, strength ${strength}`,
      );

      return { touchCount, strength };
    } catch (error) {
      this.logger.error(
        `Failed to calculate touches for ${symbol} ${interval} at ${levelPrice}:`,
        error.message,
      );
      // Return 0 on error, allow recalculation later
      return { touchCount: 0, strength: 0 };
    }
  }

  /**
   * Calculate touches for multiple levels in one pass (more efficient)
   */
  async calculateTouchesForMultipleLevels(
    symbol: string,
    levels: { price: number; id?: string }[],
    interval: string,
  ): Promise<Map<number, TouchCalculationResult>> {
    const results = new Map<number, TouchCalculationResult>();

    try {
      const candles = await this.getHistoricalCandles(symbol, interval);

      if (candles.length === 0) {
        this.logger.warn(`No candles available for ${symbol} ${interval}`);
        // Return 0 for all levels
        levels.forEach(level => {
          results.set(level.price, { touchCount: 0, strength: 0 });
        });
        return results;
      }

      // Initialize counters for all levels
      const touchCounts = new Map<number, number>();
      levels.forEach(level => touchCounts.set(level.price, 0));

      // Count touches for all levels in one pass
      for (const candle of candles) {
        levels.forEach(level => {
          if (this.isTouched(candle, level.price, this.touchThreshold)) {
            touchCounts.set(level.price, touchCounts.get(level.price) + 1);
          }
        });
      }

      // Calculate strength for each level
      levels.forEach(level => {
        const touchCount = touchCounts.get(level.price) || 0;
        const strength = this.calculateStrength(touchCount, candles.length);
        results.set(level.price, { touchCount, strength });
      });

      this.logger.log(
        `Calculated touches for ${levels.length} levels on ${symbol} ${interval} using ${candles.length} candles`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to calculate touches for multiple levels on ${symbol} ${interval}:`,
        error.message,
      );
      // Return 0 for all levels on error
      levels.forEach(level => {
        results.set(level.price, { touchCount: 0, strength: 0 });
      });
      return results;
    }
  }

  /**
   * Check if a candle touched a level
   */
  private isTouched(candle: Candle, levelPrice: number, threshold: number): boolean {
    const upperBound = levelPrice * (1 + threshold);
    const lowerBound = levelPrice * (1 - threshold);
    return candle.low <= upperBound && candle.high >= lowerBound;
  }

  /**
   * Calculate strength score (0-100) based on touches
   * More touches relative to total candles = stronger level
   */
  private calculateStrength(touchCount: number, totalCandles: number): number {
    if (totalCandles === 0) return 0;

    // Calculate touch ratio
    const touchRatio = touchCount / totalCandles;

    // Scale to 0-100, with a multiplier to make scores more meaningful
    // A level touched 1% of the time gets score 10, 5% gets 50, 10% gets 100
    const strength = Math.min(100, touchRatio * 1000);

    return Math.round(strength);
  }

  /**
   * Get historical candles with caching
   */
  private async getHistoricalCandles(symbol: string, interval: string): Promise<Candle[]> {
    const cacheKey = `${symbol}_${interval}`;
    const now = Date.now();

    // Check cache
    const cached = this.candleCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.cacheTTL) {
      this.logger.debug(`Using cached candles for ${cacheKey}`);
      return cached.data;
    }

    // Fetch from API
    this.logger.log(`Fetching ${this.candlesLimit} candles for ${symbol} ${interval}`);
    const candles = await this.bingxService.getCandles(symbol, interval, this.candlesLimit);

    // Update cache
    this.candleCache.set(cacheKey, { data: candles, timestamp: now });

    // Clean old cache entries (simple cleanup)
    if (this.candleCache.size > 100) {
      const oldestKeys = Array.from(this.candleCache.keys()).slice(0, 50);
      oldestKeys.forEach(key => this.candleCache.delete(key));
    }

    return candles;
  }

  /**
   * Clear cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.candleCache.clear();
    this.logger.log('Candle cache cleared');
  }
}
