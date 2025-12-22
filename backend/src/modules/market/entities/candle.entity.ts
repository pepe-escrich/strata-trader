export class CandleEntity {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  constructor(partial: Partial<CandleEntity>) {
    Object.assign(this, partial);
  }
}
