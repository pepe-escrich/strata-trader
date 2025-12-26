export interface Symbol {
  symbol: string;
  minQty: string;
  maxQty: string;
  minNotional: string;
  tickSize: string;
  status: string;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
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
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export type Interval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';

export interface Level {
  id: string;
  symbol: string;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  timeframe: string;
  method: CalculationMethod;
  strength: number; // 0-100
  touches: number;
  lastTouch?: Date;
  status: LevelStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum CalculationMethod {
  PIVOT_STANDARD = 'PIVOT_STANDARD',
  PIVOT_FIBONACCI = 'PIVOT_FIBONACCI',
  PIVOT_CAMARILLA = 'PIVOT_CAMARILLA',
  SWING_HIGH_LOW = 'SWING_HIGH_LOW',
  VOLUME_PROFILE_POC = 'VOLUME_PROFILE_POC',
  VOLUME_PROFILE_VAH = 'VOLUME_PROFILE_VAH',
  VOLUME_PROFILE_VAL = 'VOLUME_PROFILE_VAL',
  FIBONACCI_RETRACEMENT = 'FIBONACCI_RETRACEMENT',
}

export enum LevelStatus {
  ACTIVE = 'ACTIVE',
  BROKEN = 'BROKEN',
  TESTED = 'TESTED',
}

export interface LevelsResponse {
  symbol: string;
  timeframe: string;
  count: number;
  levels: Level[];
}

export interface MultiTimeframeLevelsResponse {
  symbol: string;
  timeframes: string[];
  results: Record<string, { count: number; levels: Level[] }>;
}

export interface StrengthAnalysisResponse {
  symbol: string;
  timeframe: string;
  total: number;
  byStrength: {
    strong: { count: number; levels: Level[] };
    medium: { count: number; levels: Level[] };
    weak: { count: number; levels: Level[] };
  };
  byType: {
    supports: { count: number; levels: Level[] };
    resistances: { count: number; levels: Level[] };
  };
}
