import { Injectable } from '@nestjs/common';
import { Candle } from '../../bingx/interfaces/bingx-response.interface';
import { BaseCalculator } from './base.calculator';
import { CalculatorResult } from '../entities/level.entity';

interface SwingPoint {
  price: number;
  index: number;
  touches: number;
}

/**
 * Swing Levels Calculator
 * Identifies support and resistance based on swing highs and swing lows
 */
@Injectable()
export class SwingLevelsCalculator extends BaseCalculator {
  name = 'Swing Levels';

  /**
   * Find swing highs in the candle data
   * A swing high is a peak surrounded by lower highs on both sides
   */
  findSwingHighs(candles: Candle[], lookback: number = 5): number[] {
    const swingHighs: SwingPoint[] = [];

    for (let i = lookback; i < candles.length - lookback; i++) {
      const currentHigh = candles[i].high;
      let isSwingHigh = true;

      // Check if current high is higher than surrounding candles
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && candles[j].high >= currentHigh) {
          isSwingHigh = false;
          break;
        }
      }

      if (isSwingHigh) {
        swingHighs.push({
          price: currentHigh,
          index: i,
          touches: 1,
        });
      }
    }

    // Group similar levels (within 0.5% of each other)
    const grouped = this.groupSimilarLevels(swingHighs);

    return grouped.map((sp) => this.roundPrice(sp.price));
  }

  /**
   * Find swing lows in the candle data
   * A swing low is a trough surrounded by higher lows on both sides
   */
  findSwingLows(candles: Candle[], lookback: number = 5): number[] {
    const swingLows: SwingPoint[] = [];

    for (let i = lookback; i < candles.length - lookback; i++) {
      const currentLow = candles[i].low;
      let isSwingLow = true;

      // Check if current low is lower than surrounding candles
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && candles[j].low <= currentLow) {
          isSwingLow = false;
          break;
        }
      }

      if (isSwingLow) {
        swingLows.push({
          price: currentLow,
          index: i,
          touches: 1,
        });
      }
    }

    // Group similar levels
    const grouped = this.groupSimilarLevels(swingLows);

    return grouped.map((sp) => this.roundPrice(sp.price));
  }

  /**
   * Group similar price levels within tolerance
   */
  private groupSimilarLevels(levels: SwingPoint[], tolerance: number = 0.005): SwingPoint[] {
    if (levels.length === 0) return [];

    const grouped: SwingPoint[] = [];
    const sorted = [...levels].sort((a, b) => a.price - b.price);

    let currentGroup: SwingPoint[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prevPrice = currentGroup[0].price;
      const currentPrice = sorted[i].price;

      // Check if within tolerance (0.5% by default)
      if (Math.abs(currentPrice - prevPrice) / prevPrice <= tolerance) {
        currentGroup.push(sorted[i]);
      } else {
        // Create grouped level (average price, sum touches)
        grouped.push({
          price: currentGroup.reduce((sum, sp) => sum + sp.price, 0) / currentGroup.length,
          index: currentGroup[0].index,
          touches: currentGroup.length,
        });
        currentGroup = [sorted[i]];
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      grouped.push({
        price: currentGroup.reduce((sum, sp) => sum + sp.price, 0) / currentGroup.length,
        index: currentGroup[0].index,
        touches: currentGroup.length,
      });
    }

    return grouped;
  }

  /**
   * Validate levels by checking number of touches
   * More touches = stronger level
   */
  validateByTouches(candles: Candle[], levels: number[], minTouches: number = 2): number[] {
    const validated: Array<{ price: number; touches: number }> = [];

    for (const level of levels) {
      let touches = 0;
      const tolerance = level * 0.002; // 0.2% tolerance

      // Count how many times price touched this level
      for (const candle of candles) {
        if (
          Math.abs(candle.high - level) <= tolerance ||
          Math.abs(candle.low - level) <= tolerance ||
          (candle.low <= level && candle.high >= level)
        ) {
          touches++;
        }
      }

      if (touches >= minTouches) {
        validated.push({ price: level, touches });
      }
    }

    // Sort by number of touches (stronger levels first)
    return validated
      .sort((a, b) => b.touches - a.touches)
      .map((v) => v.price);
  }

  /**
   * Main calculate method
   */
  calculate(
    candles: Candle[],
    config?: {
      lookback?: number;
      minTouches?: number;
      maxLevels?: number;
    },
  ): CalculatorResult {
    const lookback = config?.lookback || 5;
    const minTouches = config?.minTouches || 2;
    const maxLevels = config?.maxLevels || 5;

    if (candles.length < lookback * 2 + 1) {
      return { supports: [], resistances: [] };
    }

    // Find swing points
    let resistances = this.findSwingHighs(candles, lookback);
    let supports = this.findSwingLows(candles, lookback);

    // Validate by touches
    resistances = this.validateByTouches(candles, resistances, minTouches);
    supports = this.validateByTouches(candles, supports, minTouches);

    // Limit number of levels
    resistances = resistances.slice(0, maxLevels);
    supports = supports.slice(0, maxLevels);

    return {
      supports,
      resistances,
      metadata: {
        lookback,
        minTouches,
      },
    };
  }
}
