import { Injectable, Logger } from '@nestjs/common';
import { BingxService } from '../bingx/bingx.service';
import { Candle } from '../bingx/interfaces/bingx-response.interface';
import { CalculateFrvpDto } from './dto/calculate-frvp.dto';
import { FrvpResult, VolumeBin, FrvpLevel } from './interfaces/frvp.interface';

@Injectable()
export class FrvpService {
  private readonly logger = new Logger(FrvpService.name);

  constructor(private readonly bingxService: BingxService) {}

  async calculateFrvp(dto: CalculateFrvpDto): Promise<FrvpResult> {
    this.logger.log(
      `Calculating FRVP for ${dto.symbol} from ${new Date(dto.startTime).toISOString()} to ${new Date(dto.endTime).toISOString()}`,
    );

    // Validate price range
    if (dto.highPrice <= dto.lowPrice) {
      throw new Error('highPrice must be greater than lowPrice');
    }

    // Validate time range
    if (dto.endTime <= dto.startTime) {
      throw new Error('endTime must be greater than startTime');
    }

    // Get candles from Binance for the time range
    const candles = await this.getCandlesInRange(
      dto.symbol,
      dto.interval,
      dto.startTime,
      dto.endTime,
    );

    if (candles.length === 0) {
      throw new Error('No candles found in the specified time range');
    }

    this.logger.log(`Retrieved ${candles.length} candles for FRVP calculation`);

    // Calculate volume profile
    const bins = this.calculateVolumeProfile(
      candles,
      dto.lowPrice,
      dto.highPrice,
      dto.bins,
    );

    // Calculate total volume
    const totalVolume = bins.reduce((sum, bin) => sum + bin.volume, 0);

    // Find POC (Point of Control - highest volume bin)
    const pocBin = bins.reduce((max, bin) =>
      bin.volume > max.volume ? bin : max,
    );
    const poc = pocBin.price;

    // Calculate Value Area (70% of volume around POC)
    const { vah, val, valueAreaVolume } = this.calculateValueArea(
      bins,
      totalVolume,
      pocBin,
    );

    // Identify HVN and LVN (High/Low Volume Nodes)
    const hvnLvn = this.identifyVolumeNodes(bins, totalVolume);

    // Build levels array
    const levels: FrvpLevel[] = [
      {
        price: poc,
        type: 'poc',
        label: 'POC',
        volume: pocBin.volume,
        description: 'Point of Control - Highest volume',
      },
      {
        price: vah,
        type: 'vah',
        label: 'VAH',
        volume: bins.find((b) => b.price === vah)?.volume || 0,
        description: 'Value Area High - Top of 70% volume',
      },
      {
        price: val,
        type: 'val',
        label: 'VAL',
        volume: bins.find((b) => b.price === val)?.volume || 0,
        description: 'Value Area Low - Bottom of 70% volume',
      },
      ...hvnLvn,
    ];

    return {
      symbol: dto.symbol,
      interval: dto.interval,
      range: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        highPrice: dto.highPrice,
        lowPrice: dto.lowPrice,
      },
      totalVolume,
      bins,
      levels,
      poc,
      vah,
      val,
      valueAreaVolume,
      timestamp: Date.now(),
    };
  }

  private async getCandlesInRange(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
  ): Promise<Candle[]> {
    const allCandles: Candle[] = [];
    let currentStartTime = startTime;
    const maxLimit = 1000; // Binance limit per request

    // Fetch candles in batches if needed
    while (currentStartTime < endTime) {
      const candles = await this.bingxService.getCandles(
        symbol,
        interval,
        maxLimit,
        currentStartTime,
        endTime,
      );

      if (candles.length === 0) break;

      allCandles.push(...candles);

      // Update start time for next batch
      const lastCandle = candles[candles.length - 1];
      currentStartTime = lastCandle.timestamp + 1;

      // Break if we got fewer candles than requested (reached the end)
      if (candles.length < maxLimit) break;
    }

    return allCandles;
  }

  private calculateVolumeProfile(
    candles: Candle[],
    lowPrice: number,
    highPrice: number,
    numBins: number,
  ): VolumeBin[] {
    // Initialize bins
    const binSize = (highPrice - lowPrice) / numBins;
    const bins: VolumeBin[] = [];

    for (let i = 0; i < numBins; i++) {
      const binLow = lowPrice + i * binSize;
      const binHigh = binLow + binSize;
      const binCenter = (binLow + binHigh) / 2;

      bins.push({
        price: binCenter,
        volume: 0,
        percentage: 0,
      });
    }

    // Distribute volume across bins
    for (const candle of candles) {
      // Skip candles outside the price range
      if (candle.high < lowPrice || candle.low > highPrice) {
        continue;
      }

      // Determine which bins this candle intersects
      const candleLow = Math.max(candle.low, lowPrice);
      const candleHigh = Math.min(candle.high, highPrice);

      const startBinIndex = Math.floor((candleLow - lowPrice) / binSize);
      const endBinIndex = Math.floor((candleHigh - lowPrice) / binSize);

      const affectedBins = endBinIndex - startBinIndex + 1;

      // Distribute volume proportionally across affected bins
      const volumePerBin = candle.volume / affectedBins;

      for (let i = startBinIndex; i <= endBinIndex && i < numBins; i++) {
        if (i >= 0) {
          bins[i].volume += volumePerBin;
        }
      }
    }

    // Calculate percentages
    const totalVolume = bins.reduce((sum, bin) => sum + bin.volume, 0);
    bins.forEach((bin) => {
      bin.percentage = totalVolume > 0 ? (bin.volume / totalVolume) * 100 : 0;
    });

    return bins;
  }

  private calculateValueArea(
    bins: VolumeBin[],
    totalVolume: number,
    pocBin: VolumeBin,
  ): { vah: number; val: number; valueAreaVolume: number } {
    const targetVolume = totalVolume * 0.7; // 70% of total volume

    // Find POC index
    const pocIndex = bins.findIndex((b) => b.price === pocBin.price);

    let currentVolume = pocBin.volume;
    let upperIndex = pocIndex;
    let lowerIndex = pocIndex;

    // Expand from POC outward until we reach 70% volume
    while (currentVolume < targetVolume) {
      const upperVolume =
        upperIndex < bins.length - 1 ? bins[upperIndex + 1].volume : 0;
      const lowerVolume = lowerIndex > 0 ? bins[lowerIndex - 1].volume : 0;

      if (upperVolume >= lowerVolume && upperIndex < bins.length - 1) {
        upperIndex++;
        currentVolume += bins[upperIndex].volume;
      } else if (lowerIndex > 0) {
        lowerIndex--;
        currentVolume += bins[lowerIndex].volume;
      } else if (upperIndex < bins.length - 1) {
        upperIndex++;
        currentVolume += bins[upperIndex].volume;
      } else {
        break; // Reached the end of both sides
      }
    }

    return {
      vah: bins[upperIndex].price,
      val: bins[lowerIndex].price,
      valueAreaVolume: currentVolume,
    };
  }

  private identifyVolumeNodes(
    bins: VolumeBin[],
    totalVolume: number,
  ): FrvpLevel[] {
    const levels: FrvpLevel[] = [];

    // Calculate average volume
    const avgVolume = totalVolume / bins.length;

    // Identify local peaks (HVN) and valleys (LVN)
    for (let i = 1; i < bins.length - 1; i++) {
      const current = bins[i];
      const prev = bins[i - 1];
      const next = bins[i + 1];

      // High Volume Node (local maximum)
      if (
        current.volume > prev.volume &&
        current.volume > next.volume &&
        current.volume > avgVolume * 1.5
      ) {
        levels.push({
          price: current.price,
          type: 'hvn',
          label: `HVN`,
          volume: current.volume,
          description: 'High Volume Node - Local peak',
        });
      }

      // Low Volume Node (local minimum)
      if (
        current.volume < prev.volume &&
        current.volume < next.volume &&
        current.volume < avgVolume * 0.5
      ) {
        levels.push({
          price: current.price,
          type: 'lvn',
          label: `LVN`,
          volume: current.volume,
          description: 'Low Volume Node - Local valley',
        });
      }
    }

    // Limit to top HVN and LVN to avoid cluttering
    const hvnLevels = levels
      .filter((l) => l.type === 'hvn')
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3); // Top 3 HVN

    const lvnLevels = levels
      .filter((l) => l.type === 'lvn')
      .sort((a, b) => a.volume - b.volume)
      .slice(0, 3); // Top 3 LVN (lowest volume)

    return [...hvnLevels, ...lvnLevels];
  }
}
