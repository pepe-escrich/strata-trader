export interface Candlestick {
  time: number; // timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
export type RefreshInterval = 10 | 30 | 60; // seconds

export interface TimeframeOption {
  value: Timeframe;
  label: string;
  seconds: number; // duración del timeframe en segundos
}

export interface RefreshIntervalOption {
  value: RefreshInterval;
  label: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: '1m', label: '1min', seconds: 60 },
  { value: '5m', label: '5min', seconds: 300 },
  { value: '15m', label: '15min', seconds: 900 },
  { value: '30m', label: '30min', seconds: 1800 },
  { value: '1h', label: '1h', seconds: 3600 },
  { value: '4h', label: '4h', seconds: 14400 },
  { value: '1d', label: '1d', seconds: 86400 }
];

export const REFRESH_INTERVAL_OPTIONS: RefreshIntervalOption[] = [
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1min' }
];
