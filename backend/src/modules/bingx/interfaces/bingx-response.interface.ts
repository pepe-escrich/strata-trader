export interface BingXResponse<T = any> {
  code: number;
  msg: string;
  data: T;
  timestamp?: number;
}

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

export interface Balance {
  asset: string;
  balance: number;
  equity: number;
  unrealizedProfit: number;
  realisedProfit: number;
  availableMargin: number;
}

export interface AccountInfo {
  balances: Balance[];
  totalWalletBalance: number;
  totalUnrealizedProfit: number;
  totalMarginBalance: number;
  totalPositionInitialMargin: number;
  totalOpenOrderInitialMargin: number;
  maxWithdrawAmount: number;
}
