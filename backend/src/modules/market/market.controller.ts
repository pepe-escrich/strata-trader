import { Controller, Get, Query, Param, Delete, Logger } from '@nestjs/common';
import { MarketService } from './market.service';
import { GetCandlesDto, GetTickerDto, GetOrderBookDto } from '../bingx/dto/market-data.dto';

@Controller('market')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(private readonly marketService: MarketService) {}

  /**
   * GET /api/market/symbols
   * Get all available trading symbols
   */
  @Get('symbols')
  async getSymbols() {
    this.logger.log('GET /api/market/symbols');
    return this.marketService.getSymbols();
  }

  /**
   * GET /api/market/candles
   * Get candlestick/kline data
   * Query params: symbol, interval, limit?, startTime?, endTime?
   */
  @Get('candles')
  async getCandles(@Query() query: GetCandlesDto) {
    this.logger.log(`GET /api/market/candles - ${query.symbol} ${query.interval}`);
    return this.marketService.getCandles(
      query.symbol,
      query.interval,
      query.limit,
      query.startTime,
      query.endTime,
    );
  }

  /**
   * GET /api/market/ticker/:symbol
   * Get latest price and 24h stats for a symbol
   */
  @Get('ticker/:symbol')
  async getTicker(@Param('symbol') symbol: string) {
    this.logger.log(`GET /api/market/ticker/${symbol}`);
    return this.marketService.getTicker(symbol);
  }

  /**
   * GET /api/market/tickers
   * Get all tickers
   */
  @Get('tickers')
  async getAllTickers() {
    this.logger.log('GET /api/market/tickers');
    return this.marketService.getAllTickers();
  }

  /**
   * GET /api/market/depth/:symbol
   * Get order book depth
   * Query params: limit?
   */
  @Get('depth/:symbol')
  async getOrderBook(
    @Param('symbol') symbol: string,
    @Query() query: GetOrderBookDto,
  ) {
    this.logger.log(`GET /api/market/depth/${symbol}`);
    return this.marketService.getOrderBook(symbol, query.limit);
  }

  /**
   * GET /api/market/cache/stats
   * Get cache statistics
   */
  @Get('cache/stats')
  async getCacheStats() {
    this.logger.log('GET /api/market/cache/stats');
    return this.marketService.getCacheStats();
  }

  /**
   * DELETE /api/market/cache
   * Clear all caches
   */
  @Delete('cache')
  async clearCache() {
    this.logger.log('DELETE /api/market/cache');
    this.marketService.clearCache();
    return { message: 'All caches cleared successfully' };
  }

  /**
   * DELETE /api/market/cache/:symbol
   * Clear cache for specific symbol
   */
  @Delete('cache/:symbol')
  async clearSymbolCache(@Param('symbol') symbol: string) {
    this.logger.log(`DELETE /api/market/cache/${symbol}`);
    this.marketService.clearSymbolCache(symbol);
    return { message: `Cache cleared for ${symbol}` };
  }
}
