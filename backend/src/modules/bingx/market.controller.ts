import { Controller, Get, Query, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BingxService } from './bingx.service';

@Controller('market')
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(private readonly bingxService: BingxService) {
    this.logger.log('MarketController initialized');
  }

  @Get()
  getInfo() {
    return {
      controller: 'MarketController',
      endpoints: [
        'GET /market/klines',
        'GET /market/ticker',
        'GET /market/tickers'
      ],
      timestamp: new Date().toISOString()
    };
  }

  @Get('klines')
  async getKlines(
    @Query('symbol') symbol: string,
    @Query('interval') interval: string,
    @Query('limit') limit?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    this.logger.log(`GET /market/klines - symbol: ${symbol}, interval: ${interval}, limit: ${limit}`);

    if (!symbol || !interval) {
      this.logger.error('Missing required parameters: symbol or interval');
      throw new HttpException(
        'symbol and interval are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const limitNum = limit ? parseInt(limit, 10) : 500;
    const startTimeNum = startTime ? parseInt(startTime, 10) : undefined;
    const endTimeNum = endTime ? parseInt(endTime, 10) : undefined;

    try {
      const candles = await this.bingxService.getCandles(
        symbol,
        interval,
        limitNum,
        startTimeNum,
        endTimeNum,
      );

      this.logger.log(`Successfully fetched ${candles.length} candles for ${symbol}`);

      return {
        code: 0,
        msg: 'Success',
        data: candles.map(candle => [
          candle.timestamp,
          candle.open.toString(),
          candle.high.toString(),
          candle.low.toString(),
          candle.close.toString(),
          candle.volume.toString(),
        ]),
      };
    } catch (error) {
      this.logger.error(`Error fetching candles for ${symbol}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch candles from BingX',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('ticker')
  async getTicker(@Query('symbol') symbol: string) {
    if (!symbol) {
      throw new HttpException('symbol is required', HttpStatus.BAD_REQUEST);
    }

    const ticker = await this.bingxService.getTicker(symbol);
    return {
      code: 0,
      msg: 'Success',
      data: ticker,
    };
  }

  @Get('tickers')
  async getAllTickers() {
    const tickers = await this.bingxService.getAllTickers();
    return {
      code: 0,
      msg: 'Success',
      data: tickers,
    };
  }
}
