import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as WebSocket from 'ws';

interface KlineSubscription {
  symbol: string;
  interval: string;
  clientId: string;
}

interface BinanceKlineData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
    V: string; // Taker buy base asset volume
    Q: string; // Taker buy quote asset volume
    B: string; // Ignore
  };
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: 'market',
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MarketGateway.name);
  private binanceConnections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // streamKey -> Set of clientIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.cleanupClientSubscriptions(client.id);
  }

  @SubscribeMessage('subscribe_kline')
  handleSubscribeKline(
    @MessageBody() data: { symbol: string; interval: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { symbol, interval } = data;
    const streamKey = this.getStreamKey(symbol, interval);
    const clientId = client.id;

    this.logger.log(
      `Client ${clientId} subscribing to ${symbol} ${interval} klines`,
    );

    // Add client to subscription set
    if (!this.subscriptions.has(streamKey)) {
      this.subscriptions.set(streamKey, new Set());
    }
    this.subscriptions.get(streamKey).add(clientId);

    // If no active Binance connection for this stream, create one
    if (!this.binanceConnections.has(streamKey)) {
      this.createBinanceConnection(symbol, interval, streamKey);
    }

    return { success: true, message: `Subscribed to ${symbol} ${interval}` };
  }

  @SubscribeMessage('unsubscribe_kline')
  handleUnsubscribeKline(
    @MessageBody() data: { symbol: string; interval: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { symbol, interval } = data;
    const streamKey = this.getStreamKey(symbol, interval);
    const clientId = client.id;

    this.logger.log(
      `Client ${clientId} unsubscribing from ${symbol} ${interval} klines`,
    );

    // Remove client from subscription set
    if (this.subscriptions.has(streamKey)) {
      this.subscriptions.get(streamKey).delete(clientId);

      // If no more clients subscribed, close Binance connection
      if (this.subscriptions.get(streamKey).size === 0) {
        this.closeBinanceConnection(streamKey);
        this.subscriptions.delete(streamKey);
      }
    }

    return {
      success: true,
      message: `Unsubscribed from ${symbol} ${interval}`,
    };
  }

  private getStreamKey(symbol: string, interval: string): string {
    // Remove hyphens from symbol (BTC-USDT -> BTCUSDT)
    const formattedSymbol = symbol.replace(/-/g, '').toLowerCase();
    return `${formattedSymbol}@kline_${interval}`;
  }

  private createBinanceConnection(
    symbol: string,
    interval: string,
    streamKey: string,
  ) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamKey}`;
    this.logger.log(`Connecting to Binance WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      this.logger.log(`Binance WebSocket opened for ${streamKey}`);
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message: BinanceKlineData = JSON.parse(data.toString());

        if (message.e === 'kline') {
          const kline = message.k;

          // Format the data for frontend
          const candleData = {
            timestamp: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isClosed: kline.x,
            symbol: symbol,
            interval: interval,
          };

          // Send to all subscribed clients
          if (this.subscriptions.has(streamKey)) {
            this.subscriptions.get(streamKey).forEach((clientId) => {
              this.server.to(clientId).emit('kline_update', candleData);
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error parsing Binance message: ${error.message}`);
      }
    });

    ws.on('error', (error) => {
      this.logger.error(`Binance WebSocket error for ${streamKey}: ${error}`);
    });

    ws.on('close', () => {
      this.logger.log(`Binance WebSocket closed for ${streamKey}`);
      this.binanceConnections.delete(streamKey);

      // Try to reconnect if there are still subscribers
      if (
        this.subscriptions.has(streamKey) &&
        this.subscriptions.get(streamKey).size > 0
      ) {
        this.logger.log(`Attempting to reconnect to ${streamKey}...`);
        setTimeout(() => {
          this.createBinanceConnection(symbol, interval, streamKey);
        }, 5000);
      }
    });

    this.binanceConnections.set(streamKey, ws);
  }

  private closeBinanceConnection(streamKey: string) {
    const ws = this.binanceConnections.get(streamKey);
    if (ws) {
      this.logger.log(`Closing Binance WebSocket for ${streamKey}`);
      ws.close();
      this.binanceConnections.delete(streamKey);
    }
  }

  private cleanupClientSubscriptions(clientId: string) {
    // Remove client from all subscriptions
    this.subscriptions.forEach((clients, streamKey) => {
      clients.delete(clientId);

      // If no more clients subscribed, close Binance connection
      if (clients.size === 0) {
        this.closeBinanceConnection(streamKey);
        this.subscriptions.delete(streamKey);
      }
    });
  }

  onModuleDestroy() {
    // Close all Binance connections on module destroy
    this.binanceConnections.forEach((ws, streamKey) => {
      this.logger.log(`Closing Binance WebSocket for ${streamKey}`);
      ws.close();
    });
    this.binanceConnections.clear();
    this.subscriptions.clear();
  }
}
