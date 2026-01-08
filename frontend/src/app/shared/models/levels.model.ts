export type LevelType = 'pivot' | 'fibonacci' | 'ichimoku';
export type LevelInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '12h' | '1d' | '1w';

export interface PivotPoints {
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
  conversion: number;
  base: number;
  spanA: number;
  spanB: number;
  currentSpanA: number;
  currentSpanB: number;
  laggingSpanA: number;
  laggingSpanB: number;
}

export interface LevelsResponse {
  symbol: string;
  interval: string;
  type: LevelType;
  data: PivotPoints | FibonacciRetracement | IchimokuCloud;
  timestamp: number;
}

export interface LevelIntervalOption {
  value: LevelInterval;
  label: string;
}

export const LEVEL_INTERVAL_OPTIONS: LevelIntervalOption[] = [
  { value: '1m', label: '1min' },
  { value: '5m', label: '5min' },
  { value: '15m', label: '15min' },
  { value: '30m', label: '30min' },
  { value: '1h', label: '1h' },
  { value: '2h', label: '2h' },
  { value: '4h', label: '4h' },
  { value: '12h', label: '12h' },
  { value: '1d', label: '1d' },
  { value: '1w', label: '1w' },
];
