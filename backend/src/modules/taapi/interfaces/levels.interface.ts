export interface PivotPointsResponse {
  r3: number;
  r2: number;
  r1: number;
  p: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface FibonacciLevel {
  level: string;
  percentage: number;
  price: number;
}

export interface FibonacciRetracement {
  trend: string;
  startPrice: number;
  endPrice: number;
  startTimestamp: number;
  endTimestamp: number;
  levels: FibonacciLevel[];
}

export interface IchimokuCloud {
  conversion: number; // Tenkan-sen
  base: number; // Kijun-sen
  spanA: number; // Senkou Span A
  spanB: number; // Senkou Span B
  currentSpanA: number;
  currentSpanB: number;
  laggingSpanA: number;
  laggingSpanB: number;
}

export interface LevelsResponse {
  symbol: string;
  interval: string;
  type: 'pivot' | 'fibonacci' | 'ichimoku';
  data: PivotPointsResponse | FibonacciRetracement | IchimokuCloud;
  timestamp: number;
}
