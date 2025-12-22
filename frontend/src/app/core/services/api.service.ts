import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../../environments/environment';
import { Symbol, Candle, Ticker, OrderBook, Interval } from '../models/market.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: environment.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ========== Market Endpoints ==========

  async getSymbols(): Promise<Symbol[]> {
    const response = await this.api.get('/market/symbols');
    return response.data;
  }

  async getCandles(
    symbol: string,
    interval: Interval,
    limit: number = 500,
    startTime?: number,
    endTime?: number
  ): Promise<Candle[]> {
    const params: any = { symbol, interval, limit };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await this.api.get('/market/candles', { params });
    return response.data;
  }

  async getTicker(symbol: string): Promise<Ticker> {
    const response = await this.api.get(`/market/ticker/${symbol}`);
    return response.data;
  }

  async getAllTickers(): Promise<Ticker[]> {
    const response = await this.api.get('/market/tickers');
    return response.data;
  }

  async getOrderBook(symbol: string, limit: number = 100): Promise<OrderBook> {
    const response = await this.api.get(`/market/depth/${symbol}`, {
      params: { limit },
    });
    return response.data;
  }

  async clearCache(): Promise<void> {
    await this.api.delete('/market/cache');
  }

  async clearSymbolCache(symbol: string): Promise<void> {
    await this.api.delete(`/market/cache/${symbol}`);
  }

  async getCacheStats(): Promise<{ candleCacheSize: number; tickerCacheSize: number }> {
    const response = await this.api.get('/market/cache/stats');
    return response.data;
  }
}
