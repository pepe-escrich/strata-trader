import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { BingxService } from './bingx.service';

@Controller('market')
export class MarketController {
  constructor(private readonly bingxService: BingxService) {}

  @Get('klines')
  async getKlines(
    @Query('symbol') symbol: string,
    @Query('interval') interval: string,
    @Query('limit') limit?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    if (!symbol || !interval) {
      throw new HttpException(
        'symbol and interval are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const limitNum = limit ? parseInt(limit, 10) : 500;
    const startTimeNum = startTime ? parseInt(startTime, 10) : undefined;
    const endTimeNum = endTime ? parseInt(endTime, 10) : undefined;

    const candles = await this.bingxService.getCandles(
      symbol,
      interval,
      limitNum,
      startTimeNum,
      endTimeNum,
    );

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
