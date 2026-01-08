import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  PivotPointsResponse,
  FibonacciRetracement,
  IchimokuCloud,
  FibonacciLevel,
} from './interfaces/levels.interface';

@Injectable()
export class TaapiService {
  private readonly logger = new Logger(TaapiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('taapi.apiKey');
    this.baseUrl = this.configService.get<string>('taapi.baseUrl');
    this.timeout = this.configService.get<number>('taapi.timeout');
  }

  async getPivotPoints(
    symbol: string,
    interval: string,
    exchange: string = 'binance',
  ): Promise<PivotPointsResponse> {
    const url = `${this.baseUrl}/pivotpoints`;
    // Convertir BTCUSDT a BTC/USDT para taapi.io
    const formattedSymbol = this.formatSymbol(symbol);
    const params = {
      secret: this.apiKey,
      exchange,
      symbol: formattedSymbol,
      interval,
    };

    try {
      this.logger.log(
        `Fetching pivot points for ${formattedSymbol} on ${interval} interval`,
      );

      const response = await firstValueFrom(
        this.httpService.get<PivotPointsResponse>(url, {
          params,
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error fetching pivot points: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch pivot points: ${error.message}`);
    }
  }

  private formatSymbol(symbol: string): string {
    // Convertir BTCUSDT a BTC/USDT
    // Asumiendo que todos los pares terminan en USDT
    if (symbol.includes('/')) {
      return symbol; // Ya tiene el formato correcto
    }
    // Insertar "/" antes de USDT
    return symbol.replace(/USDT$/, '/USDT');
  }

  async getFibonacciRetracement(
    symbol: string,
    interval: string,
    exchange: string = 'binance',
  ): Promise<FibonacciRetracement> {
    const formattedSymbol = this.formatSymbol(symbol);
    const fibLevels = [
      { level: '0%', percentage: 0, retracement: 0 },
      { level: '23.6%', percentage: 23.6, retracement: 0.236 },
      { level: '38.2%', percentage: 38.2, retracement: 0.382 },
      { level: '50%', percentage: 50, retracement: 0.5 },
      { level: '61.8%', percentage: 61.8, retracement: 0.618 },
      { level: '100%', percentage: 100, retracement: 1.0 },
    ];

    try {
      this.logger.log(
        `Fetching fibonacci retracement for ${formattedSymbol} on ${interval} interval`,
      );

      // Obtener información base con el nivel 0.618 (golden ratio)
      const baseResponse = await this.fetchFibonacci(
        formattedSymbol,
        interval,
        exchange,
        0.618,
      );

      // Calcular todos los niveles basados en startPrice y endPrice
      const range = baseResponse.startPrice - baseResponse.endPrice;
      const levels: FibonacciLevel[] = fibLevels.map((fib) => ({
        level: fib.level,
        percentage: fib.percentage,
        price: baseResponse.endPrice + range * (1 - fib.retracement),
      }));

      return {
        trend: baseResponse.trend,
        startPrice: baseResponse.startPrice,
        endPrice: baseResponse.endPrice,
        startTimestamp: baseResponse.startTimestamp,
        endTimestamp: baseResponse.endTimestamp,
        levels,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching fibonacci retracement: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to fetch fibonacci retracement: ${error.message}`,
      );
    }
  }

  private async fetchFibonacci(
    symbol: string,
    interval: string,
    exchange: string,
    retracement: number,
  ): Promise<any> {
    const url = `${this.baseUrl}/fibonacciretracement`;
    const params = {
      secret: this.apiKey,
      exchange,
      symbol,
      interval,
      retracement,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, {
        params,
        timeout: this.timeout,
      }),
    );

    return response.data;
  }

  async getIchimokuCloud(
    symbol: string,
    interval: string,
    exchange: string = 'binance',
  ): Promise<IchimokuCloud> {
    const url = `${this.baseUrl}/ichimoku`;
    const formattedSymbol = this.formatSymbol(symbol);
    const params = {
      secret: this.apiKey,
      exchange,
      symbol: formattedSymbol,
      interval,
    };

    try {
      this.logger.log(
        `Fetching Ichimoku Cloud for ${formattedSymbol} on ${interval} interval`,
      );

      const response = await firstValueFrom(
        this.httpService.get<IchimokuCloud>(url, {
          params,
          timeout: this.timeout,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error fetching Ichimoku Cloud: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch Ichimoku Cloud: ${error.message}`);
    }
  }
}
