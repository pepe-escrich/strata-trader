import { IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class CalculateFrvpDto {
  @IsString()
  symbol: string;

  @IsEnum(['1m', '5m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '1w'])
  interval: string;

  @IsNumber()
  startTime: number; // Unix timestamp in milliseconds

  @IsNumber()
  endTime: number; // Unix timestamp in milliseconds

  @IsNumber()
  @Min(0)
  highPrice: number; // Top of the price range

  @IsNumber()
  @Min(0)
  lowPrice: number; // Bottom of the price range

  @IsNumber()
  @Min(20)
  @Max(500)
  bins: number = 100; // Number of price bins (resolution)
}
