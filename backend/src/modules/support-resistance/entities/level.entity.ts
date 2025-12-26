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

export interface CalculatorResult {
  supports: number[];
  resistances: number[];
  metadata?: Record<string, any>;
}
