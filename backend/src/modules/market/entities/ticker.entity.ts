export class TickerEntity {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  openPrice: number;
  timestamp: number;

  constructor(partial: Partial<TickerEntity>) {
    Object.assign(this, partial);
  }
}
