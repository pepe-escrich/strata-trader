import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  Symbol,
  Candle,
  Ticker,
  OrderBook,
  AccountInfo,
  BingXResponse,
} from './interfaces/bingx-response.interface';

@Injectable()
export class BingxService {
  private readonly logger = new Logger(BingxService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  // Rate limiting
  private requestCount = 0;
  private readonly maxRequestsPerMinute = 60;
  private lastResetTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('bingx.apiKey');
    this.secretKey = this.configService.get<string>('bingx.secretKey');
    this.baseUrl = this.configService.get<string>('bingx.baseUrl');
    this.timeout = this.configService.get<number>('bingx.timeout');
    this.retryAttempts = this.configService.get<number>('bingx.retryAttempts');
  }

  /**
   * Convert standard symbol format (BTCUSDT) to BingX format (BTC-USDT)
   */
  private formatSymbol(symbol: string): string {
    // Si ya tiene guión, retornar tal cual
    if (symbol.includes('-')) {
      return symbol;
    }

    // Convertir BTCUSDT a BTC-USDT
    // Detectar si termina en USDT o USDC
    if (symbol.endsWith('USDT')) {
      return symbol.replace('USDT', '-USDT');
    } else if (symbol.endsWith('USDC')) {
      return symbol.replace('USDC', '-USDC');
    }

    // Si no tiene formato reconocido, retornar tal cual
    this.logger.warn(`Symbol ${symbol} does not match expected format`);
    return symbol;
  }

  /**
   * Generate signature for authenticated requests
   */
  private generateSignature(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    const queryString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Check and enforce rate limiting
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every minute
    if (timeSinceReset > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = 60000 - timeSinceReset;
      throw new HttpException(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.requestCount++;
  }

  /**
   * Make a GET request to BingX API
   */
  private async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    authenticated = false,
  ): Promise<T> {
    this.checkRateLimit();

    let queryParams = { ...params };

    if (authenticated) {
      queryParams.timestamp = Date.now();
      queryParams.signature = this.generateSignature(queryParams);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = authenticated
      ? {
          'X-BX-APIKEY': this.apiKey,
        }
      : {};

    try {
      this.logger.log(`[BingX GET] URL: ${url}`);
      this.logger.log(`[BingX GET] Params: ${JSON.stringify(queryParams)}`);

      const response = await firstValueFrom(
        this.httpService.get<BingXResponse<T>>(url, {
          params: queryParams,
          headers,
          timeout: this.timeout,
        }),
      );

      this.logger.log(`[BingX GET] Response code: ${response.data.code}, msg: ${response.data.msg}`);

      if (response.data.code !== 0) {
        this.logger.error(`[BingX GET] Error response: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          response.data.msg || 'BingX API error',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`[BingX GET] Error: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(`[BingX GET] Error response data: ${JSON.stringify(error.response.data)}`);
      }
      throw new HttpException(
        error.response?.data?.msg || error.message || 'BingX API request failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all available trading symbols
   */
  async getSymbols(): Promise<Symbol[]> {
    this.logger.log('Fetching trading symbols');
    const response = await this.get<{ symbols: Symbol[] }>(
      '/openApi/swap/v2/quote/contracts',
    );
    return response.symbols || [];
  }

  /**
   * Get candlestick/kline data
   */
  async getCandles(
    symbol: string,
    interval: string,
    limit: number = 500,
    startTime?: number,
    endTime?: number,
  ): Promise<Candle[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    this.logger.log(
      `[getCandles] Input - symbol: ${symbol}, interval: ${interval}, limit: ${limit}`,
    );
    this.logger.log(
      `[getCandles] Formatted symbol: ${formattedSymbol}`,
    );

    const params: Record<string, any> = {
      symbol: formattedSymbol,
      interval,
      limit,
    };

    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    this.logger.log(`[getCandles] Params to BingX: ${JSON.stringify(params)}`);

    const rawCandles = await this.get<any[]>(
      '/openApi/swap/v3/quote/klines',
      params,
    );

    // Transform BingX format to our Candle interface
    return rawCandles.map((candle) => ({
      timestamp: parseInt(candle.time),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
    }));
  }

  /**
   * Get latest price for a symbol
   */
  async getTicker(symbol: string): Promise<Ticker> {
    const formattedSymbol = this.formatSymbol(symbol);
    this.logger.debug(`Fetching ticker for ${formattedSymbol}`);

    const response = await this.get<any>('/openApi/swap/v2/quote/ticker', {
      symbol: formattedSymbol,
    });

    return {
      symbol: response.symbol,
      price: parseFloat(response.lastPrice),
      priceChange: parseFloat(response.priceChange),
      priceChangePercent: parseFloat(response.priceChangePercent),
      high24h: parseFloat(response.highPrice),
      low24h: parseFloat(response.lowPrice),
      volume24h: parseFloat(response.volume),
      quoteVolume24h: parseFloat(response.quoteVolume),
      openPrice: parseFloat(response.openPrice),
      timestamp: parseInt(response.time),
    };
  }

  /**
   * Get all tickers
   */
  async getAllTickers(): Promise<Ticker[]> {
    this.logger.debug('Fetching all tickers');

    const response = await this.get<any[]>('/openApi/swap/v2/quote/ticker');

    return response.map((ticker) => ({
      symbol: ticker.symbol,
      price: parseFloat(ticker.lastPrice),
      priceChange: parseFloat(ticker.priceChange),
      priceChangePercent: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume24h: parseFloat(ticker.volume),
      quoteVolume24h: parseFloat(ticker.quoteVolume),
      openPrice: parseFloat(ticker.openPrice),
      timestamp: parseInt(ticker.time),
    }));
  }

  /**
   * Get order book depth
   */
  async getOrderBook(symbol: string, limit: number = 100): Promise<OrderBook> {
    const formattedSymbol = this.formatSymbol(symbol);
    this.logger.debug(`Fetching order book for ${formattedSymbol} - Limit: ${limit}`);

    const response = await this.get<any>('/openApi/swap/v2/quote/depth', {
      symbol: formattedSymbol,
      limit,
    });

    return {
      symbol: formattedSymbol,
      bids: response.bids.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: response.asks.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      timestamp: Date.now(),
    };
  }

  /**
   * Get account information (authenticated)
   */
  async getAccountInfo(): Promise<AccountInfo> {
    this.logger.debug('Fetching account information');

    const response = await this.get<any>(
      '/openApi/swap/v2/user/balance',
      {},
      true,
    );

    return {
      balances: response.balance.map((bal: any) => ({
        asset: bal.asset,
        balance: parseFloat(bal.balance),
        equity: parseFloat(bal.equity),
        unrealizedProfit: parseFloat(bal.unrealizedProfit),
        realisedProfit: parseFloat(bal.realisedProfit),
        availableMargin: parseFloat(bal.availableMargin),
      })),
      totalWalletBalance: parseFloat(response.totalWalletBalance),
      totalUnrealizedProfit: parseFloat(response.totalUnrealizedProfit),
      totalMarginBalance: parseFloat(response.totalMarginBalance),
      totalPositionInitialMargin: parseFloat(response.totalPositionInitialMargin),
      totalOpenOrderInitialMargin: parseFloat(response.totalOpenOrderInitialMargin),
      maxWithdrawAmount: parseFloat(response.maxWithdrawAmount),
    };
  }

  /**
   * Test connectivity to BingX API
   */
  async testConnectivity(): Promise<boolean> {
    try {
      await this.get('/openApi/swap/v2/server/time');
      this.logger.log('✅ BingX API connectivity test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ BingX API connectivity test failed', error.stack);
      return false;
    }
  }
}
