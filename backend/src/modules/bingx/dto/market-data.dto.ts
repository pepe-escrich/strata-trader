import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum Interval {
  ONE_MINUTE = '1m',
  THREE_MINUTES = '3m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  SIX_HOURS = '6h',
  TWELVE_HOURS = '12h',
  ONE_DAY = '1d',
  THREE_DAYS = '3d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1M',
}

export class GetCandlesDto {
  @IsString()
  symbol: string;

  @IsEnum(Interval)
  interval: Interval;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 500;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endTime?: number;
}

export class GetTickerDto {
  @IsString()
  symbol: string;
}

export class GetOrderBookDto {
  @IsString()
  symbol: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1000)
  limit?: number = 100;
}
