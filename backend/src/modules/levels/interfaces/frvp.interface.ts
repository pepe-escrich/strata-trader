export interface VolumeBin {
  price: number; // Price at center of this bin
  volume: number; // Total volume in this bin
  percentage: number; // Percentage of total volume
}

export interface FrvpLevel {
  price: number;
  type: 'poc' | 'vah' | 'val' | 'hvn' | 'lvn';
  label: string;
  volume: number;
  description: string;
}

export interface FrvpResult {
  symbol: string;
  interval: string;
  range: {
    startTime: number;
    endTime: number;
    highPrice: number;
    lowPrice: number;
  };
  totalVolume: number;
  bins: VolumeBin[];
  levels: FrvpLevel[];
  poc: number; // Point of Control (highest volume price)
  vah: number; // Value Area High (top of 70% volume)
  val: number; // Value Area Low (bottom of 70% volume)
  valueAreaVolume: number; // Volume within value area
  timestamp: number;
}
