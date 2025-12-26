import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BingxService } from '../bingx/bingx.service';
import { Candle, Ticker, Symbol, OrderBook } from '../bingx/interfaces/bingx-response.interface';
import { CandleEntity } from './entities/candle.entity';
import { TickerEntity } from './entities/ticker.entity';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly candleCache = new Map<string, CacheEntry<Candle[]>>();
  private readonly tickerCache = new Map<string, CacheEntry<Ticker>>();
  private readonly candleCacheTTL: number;

  constructor(
    private readonly bingxService: BingxService,
    private readonly configService: ConfigService,
  ) {
    this.candleCacheTTL = this.configService.get<number>('trading.market.candleCacheTTL', 300000);
    this.logger.log(`Market Service initialized - Cache TTL: ${this.candleCacheTTL}ms`);
  }

  /**
   * Generate cache key for candles
   */
  private getCandleCacheKey(symbol: string, interval: string, limit: number): string {
    return `${symbol}_${interval}_${limit}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Get all available symbols
   */
  async getSymbols(): Promise<Symbol[]> {
    this.logger.debug('Fetching symbols');
    return this.bingxService.getSymbols();
  }

  /**
   * Get candlestick data with caching
   */
  async getCandles(
    symbol: string,
    interval: string,
    limit: number = 500,
    startTime?: number,
    endTime?: number,
  ): Promise<CandleEntity[]> {
    // Only use cache if no custom time range
    if (!startTime && !endTime) {
      const cacheKey = this.getCandleCacheKey(symbol, interval, limit);
      const cached = this.candleCache.get(cacheKey);

      if (this.isCacheValid(cached) && cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached.data.map(c => new CandleEntity(c));
      }
    }

    this.logger.debug(`Fetching fresh candles for ${symbol} ${interval}`);
    const candles = await this.bingxService.getCandles(symbol, interval, limit, startTime, endTime);

    // Cache only if no custom time range
    if (!startTime && !endTime) {
      const cacheKey = this.getCandleCacheKey(symbol, interval, limit);
      this.candleCache.set(cacheKey, {
        data: candles,
        timestamp: Date.now(),
        ttl: this.candleCacheTTL,
      });
      this.logger.debug(`Cached ${candles.length} candles for ${cacheKey}`);
    }

    return candles.map(c => new CandleEntity(c));
  }

  /**
   * Get ticker with short-term caching
   */
  async getTicker(symbol: string): Promise<TickerEntity> {
    const cached = this.tickerCache.get(symbol);

    if (this.isCacheValid(cached) && cached) {
      this.logger.debug(`Cache hit for ticker ${symbol}`);
      return new TickerEntity(cached.data);
    }

    this.logger.debug(`Fetching fresh ticker for ${symbol}`);
    const ticker = await this.bingxService.getTicker(symbol);

    // Cache ticker for 5 seconds
    this.tickerCache.set(symbol, {
      data: ticker,
      timestamp: Date.now(),
      ttl: 5000,
    });

    return new TickerEntity(ticker);
  }

  /**
   * Get all tickers
   */
  async getAllTickers(): Promise<TickerEntity[]> {
    this.logger.debug('Fetching all tickers');
    const tickers = await this.bingxService.getAllTickers();
    return tickers.map(t => new TickerEntity(t));
  }

  /**
   * Get order book
   */
  async getOrderBook(symbol: string, limit: number = 100): Promise<OrderBook> {
    this.logger.debug(`Fetching order book for ${symbol}`);
    return this.bingxService.getOrderBook(symbol, limit);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.candleCache.clear();
    this.tickerCache.clear();
    this.logger.log('All caches cleared');
  }

  /**
   * Clear cache for specific symbol
   */
  clearSymbolCache(symbol: string): void {
    // Clear candle cache
    for (const key of this.candleCache.keys()) {
      if (key.startsWith(symbol)) {
        this.candleCache.delete(key);
      }
    }

    // Clear ticker cache
    this.tickerCache.delete(symbol);

    this.logger.log(`Cache cleared for ${symbol}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    candleCacheSize: number;
    tickerCacheSize: number;
  } {
    return {
      candleCacheSize: this.candleCache.size,
      tickerCacheSize: this.tickerCache.size,
    };
  }
}
