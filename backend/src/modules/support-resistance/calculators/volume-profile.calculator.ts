import { Injectable } from '@nestjs/common';
import { Candle } from '../../bingx/interfaces/bingx-response.interface';
import { BaseCalculator } from './base.calculator';
import { CalculatorResult } from '../entities/level.entity';

interface VolumeNode {
  price: number;
  volume: number;
}

/**
 * Volume Profile Calculator
 * Calculates support and resistance based on volume distribution
 */
@Injectable()
export class VolumeProfileCalculator extends BaseCalculator {
  name = 'Volume Profile';

  /**
   * Build volume profile - distribute volume across price levels
   */
  private buildVolumeProfile(candles: Candle[], numBins: number = 50): VolumeNode[] {
    if (candles.length === 0) return [];

    // Find price range
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceStep = (maxPrice - minPrice) / numBins;

    // Initialize bins
    const bins: VolumeNode[] = [];
    for (let i = 0; i < numBins; i++) {
      bins.push({
        price: minPrice + priceStep * (i + 0.5),
        volume: 0,
      });
    }

    // Distribute volume across bins
    for (const candle of candles) {
      const candleRange = candle.high - candle.low;
      const volumePerPrice = candleRange > 0 ? candle.volume / candleRange : candle.volume;

      // Find which bins this candle touches
      for (const bin of bins) {
        if (bin.price >= candle.low && bin.price <= candle.high) {
          bin.volume += volumePerPrice * priceStep;
        }
      }
    }

    return bins;
  }

  /**
   * Calculate Point of Control (POC)
   * Price level with the highest volume
   */
  calculatePOC(candles: Candle[]): number {
    const profile = this.buildVolumeProfile(candles);

    if (profile.length === 0) return 0;

    // Find bin with highest volume
    const poc = profile.reduce((max, node) => (node.volume > max.volume ? node : max), profile[0]);

    return this.roundPrice(poc.price);
  }

  /**
   * Calculate Value Area High and Low (VAH/VAL)
   * 70% of total volume is traded within the value area
   */
  calculateValueArea(candles: Candle[]): { vah: number; val: number } {
    const profile = this.buildVolumeProfile(candles);

    if (profile.length === 0) return { vah: 0, val: 0 };

    // Sort by volume
    const sorted = [...profile].sort((a, b) => b.volume - a.volume);

    // Calculate total volume
    const totalVolume = sorted.reduce((sum, node) => sum + node.volume, 0);
    const targetVolume = totalVolume * 0.7; // 70% value area

    // Find nodes that make up 70% of volume
    let accumulatedVolume = 0;
    const valueAreaNodes: VolumeNode[] = [];

    for (const node of sorted) {
      if (accumulatedVolume >= targetVolume) break;
      valueAreaNodes.push(node);
      accumulatedVolume += node.volume;
    }

    // Find highest and lowest prices in value area
    const prices = valueAreaNodes.map((n) => n.price);
    const vah = Math.max(...prices);
    const val = Math.min(...prices);

    return {
      vah: this.roundPrice(vah),
      val: this.roundPrice(val),
    };
  }

  /**
   * Find high volume nodes (HVN) - potential support/resistance
   */
  private findHighVolumeNodes(candles: Candle[], threshold: number = 0.8): number[] {
    const profile = this.buildVolumeProfile(candles);

    if (profile.length === 0) return [];

    // Calculate average volume
    const avgVolume = profile.reduce((sum, node) => sum + node.volume, 0) / profile.length;

    // Find nodes with volume above threshold
    const hvn = profile
      .filter((node) => node.volume >= avgVolume * threshold)
      .map((node) => node.price)
      .sort((a, b) => a - b);

    // Group nearby HVNs (within 1%)
    const grouped: number[] = [];
    if (hvn.length === 0) return grouped;

    let currentGroup = [hvn[0]];

    for (let i = 1; i < hvn.length; i++) {
      const prev = currentGroup[currentGroup.length - 1];
      const curr = hvn[i];

      if (Math.abs(curr - prev) / prev <= 0.01) {
        currentGroup.push(curr);
      } else {
        // Average the group
        const avg = currentGroup.reduce((sum, p) => sum + p, 0) / currentGroup.length;
        grouped.push(this.roundPrice(avg));
        currentGroup = [curr];
      }
    }

    // Don't forget last group
    if (currentGroup.length > 0) {
      const avg = currentGroup.reduce((sum, p) => sum + p, 0) / currentGroup.length;
      grouped.push(this.roundPrice(avg));
    }

    return grouped;
  }

  /**
   * Main calculate method
   */
  calculate(candles: Candle[], config?: { numBins?: number }): CalculatorResult {
    const numBins = config?.numBins || 50;

    if (candles.length < 10) {
      return { supports: [], resistances: [] };
    }

    const poc = this.calculatePOC(candles);
    const { vah, val } = this.calculateValueArea(candles);
    const hvn = this.findHighVolumeNodes(candles);

    // Get current price to determine support vs resistance
    const currentPrice = candles[candles.length - 1].close;

    // Levels below current price are supports
    const supports = [val, ...hvn.filter((p) => p < currentPrice)]
      .filter((p) => p > 0)
      .sort((a, b) => b - a); // Closest first

    // Levels above current price are resistances
    const resistances = [vah, ...hvn.filter((p) => p > currentPrice)]
      .filter((p) => p > 0)
      .sort((a, b) => a - b); // Closest first

    return {
      supports: supports.slice(0, 5), // Top 5
      resistances: resistances.slice(0, 5), // Top 5
      metadata: {
        poc,
        vah,
        val,
        numBins,
      },
    };
  }
}
