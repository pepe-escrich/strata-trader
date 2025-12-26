import { Candle } from '../../bingx/interfaces/bingx-response.interface';
import { CalculatorResult } from '../entities/level.entity';

export abstract class BaseCalculator {
  abstract name: string;

  /**
   * Calculate support and resistance levels
   */
  abstract calculate(candles: Candle[], config?: any): CalculatorResult;

  /**
   * Helper: Find highest high in a range
   */
  protected findHighestHigh(candles: Candle[], start: number, end: number): number {
    let highest = -Infinity;
    for (let i = start; i <= end && i < candles.length; i++) {
      if (candles[i].high > highest) {
        highest = candles[i].high;
      }
    }
    return highest;
  }

  /**
   * Helper: Find lowest low in a range
   */
  protected findLowestLow(candles: Candle[], start: number, end: number): number {
    let lowest = Infinity;
    for (let i = start; i <= end && i < candles.length; i++) {
      if (candles[i].low < lowest) {
        lowest = candles[i].low;
      }
    }
    return lowest;
  }

  /**
   * Helper: Round price to reasonable precision
   */
  protected roundPrice(price: number): number {
    // Round to 2 decimal places for most cryptos
    return Math.round(price * 100) / 100;
  }
}
