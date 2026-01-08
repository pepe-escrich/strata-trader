import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Candlestick, Timeframe } from '../models/candlestick.model';

export interface KlineUpdate {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
  symbol: string;
  interval: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketMarketService implements OnDestroy {
  private socket: Socket | null = null;
  private klineUpdates$ = new Subject<KlineUpdate>();
  private connected = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const apiUrl = environment.apiUrl || 'http://localhost:3000';
    const wsUrl = apiUrl.replace(/^http/, 'ws');

    this.socket = io(`${wsUrl}/market`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
    });

    this.socket.on('kline_update', (data: KlineUpdate) => {
      this.klineUpdates$.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  subscribeToKline(symbol: string, interval: Timeframe): void {
    if (!this.socket) {
      this.connect();
    }

    console.log(`Subscribing to ${symbol} ${interval} klines`);
    this.socket?.emit('subscribe_kline', { symbol, interval });
  }

  unsubscribeFromKline(symbol: string, interval: Timeframe): void {
    if (!this.socket) {
      return;
    }

    console.log(`Unsubscribing from ${symbol} ${interval} klines`);
    this.socket.emit('unsubscribe_kline', { symbol, interval });
  }

  getKlineUpdates(): Observable<KlineUpdate> {
    return this.klineUpdates$.asObservable();
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.klineUpdates$.complete();
  }
}
