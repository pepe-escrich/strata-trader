import { Injectable } from '@nestjs/common';
import { Candle } from '../../bingx/interfaces/bingx-response.interface';
import { BaseCalculator } from './base.calculator';
import { CalculatorResult } from '../entities/level.entity';

/**
 * Pivot Points Calculator
 * Calculates support and resistance levels using pivot point formulas
 */
@Injectable()
export class PivotPointsCalculator extends BaseCalculator {
  name = 'Pivot Points';

  /**
   * Calculate Standard Pivot Points
   * PP = (High + Low + Close) / 3
   * R1 = (2 × PP) - Low
   * R2 = PP + (High - Low)
   * R3 = High + 2 × (PP - Low)
   * S1 = (2 × PP) - High
   * S2 = PP - (High - Low)
   * S3 = Low - 2 × (High - PP)
   */
  calculateStandard(candles: Candle[]): CalculatorResult {
    if (candles.length < 1) {
      return { supports: [], resistances: [] };
    }

    // Use the most recent candle for calculation
    const lastCandle = candles[candles.length - 1];
    const { high, low, close } = lastCandle;

    const pivot = (high + low + close) / 3;

    const r1 = 2 * pivot - low;
    const r2 = pivot + (high - low);
    const r3 = high + 2 * (pivot - low);

    const s1 = 2 * pivot - high;
    const s2 = pivot - (high - low);
    const s3 = low - 2 * (high - pivot);

    return {
      supports: [s1, s2, s3].map(this.roundPrice),
      resistances: [r1, r2, r3].map(this.roundPrice),
      metadata: {
        pivot: this.roundPrice(pivot),
        method: 'standard',
      },
    };
  }

  /**
   * Calculate Fibonacci Pivot Points
   * PP = (High + Low + Close) / 3
   * R1 = PP + 0.382 × (High - Low)
   * R2 = PP + 0.618 × (High - Low)
   * R3 = PP + 1.000 × (High - Low)
   * S1 = PP - 0.382 × (High - Low)
   * S2 = PP - 0.618 × (High - Low)
   * S3 = PP - 1.000 × (High - Low)
   */
  calculateFibonacci(candles: Candle[]): CalculatorResult {
    if (candles.length < 1) {
      return { supports: [], resistances: [] };
    }

    const lastCandle = candles[candles.length - 1];
    const { high, low, close } = lastCandle;

    const pivot = (high + low + close) / 3;
    const range = high - low;

    const r1 = pivot + 0.382 * range;
    const r2 = pivot + 0.618 * range;
    const r3 = pivot + 1.0 * range;

    const s1 = pivot - 0.382 * range;
    const s2 = pivot - 0.618 * range;
    const s3 = pivot - 1.0 * range;

    return {
      supports: [s1, s2, s3].map(this.roundPrice),
      resistances: [r1, r2, r3].map(this.roundPrice),
      metadata: {
        pivot: this.roundPrice(pivot),
        method: 'fibonacci',
      },
    };
  }

  /**
   * Calculate Camarilla Pivot Points
   * R4 = Close + ((High - Low) × 1.1/2)
   * R3 = Close + ((High - Low) × 1.1/4)
   * R2 = Close + ((High - Low) × 1.1/6)
   * R1 = Close + ((High - Low) × 1.1/12)
   * S1 = Close - ((High - Low) × 1.1/12)
   * S2 = Close - ((High - Low) × 1.1/6)
   * S3 = Close - ((High - Low) × 1.1/4)
   * S4 = Close - ((High - Low) × 1.1/2)
   */
  calculateCamarilla(candles: Candle[]): CalculatorResult {
    if (candles.length < 1) {
      return { supports: [], resistances: [] };
    }

    const lastCandle = candles[candles.length - 1];
    const { high, low, close } = lastCandle;

    const range = high - low;

    const r4 = close + (range * 1.1) / 2;
    const r3 = close + (range * 1.1) / 4;
    const r2 = close + (range * 1.1) / 6;
    const r1 = close + (range * 1.1) / 12;

    const s1 = close - (range * 1.1) / 12;
    const s2 = close - (range * 1.1) / 6;
    const s3 = close - (range * 1.1) / 4;
    const s4 = close - (range * 1.1) / 2;

    return {
      supports: [s1, s2, s3, s4].map(this.roundPrice),
      resistances: [r1, r2, r3, r4].map(this.roundPrice),
      metadata: {
        method: 'camarilla',
      },
    };
  }

  /**
   * Main calculate method - returns standard pivots by default
   */
  calculate(candles: Candle[], config?: { type?: 'standard' | 'fibonacci' | 'camarilla' }): CalculatorResult {
    const type = config?.type || 'standard';

    switch (type) {
      case 'fibonacci':
        return this.calculateFibonacci(candles);
      case 'camarilla':
        return this.calculateCamarilla(candles);
      case 'standard':
      default:
        return this.calculateStandard(candles);
    }
  }
}
