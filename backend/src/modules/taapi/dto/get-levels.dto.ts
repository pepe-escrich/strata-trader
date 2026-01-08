import { IsString, IsEnum, IsOptional, IsIn } from 'class-validator';

export enum LevelType {
  PIVOT = 'pivot',
  FIBONACCI = 'fibonacci',
  ICHIMOKU = 'ichimoku',
}

export enum Interval {
  ONE_MIN = '1m',
  FIVE_MIN = '5m',
  FIFTEEN_MIN = '15m',
  THIRTY_MIN = '30m',
  ONE_HOUR = '1h',
  TWO_HOUR = '2h',
  FOUR_HOUR = '4h',
  TWELVE_HOUR = '12h',
  ONE_DAY = '1d',
  ONE_WEEK = '1w',
}

export class GetLevelsDto {
  @IsString()
  symbol: string;

  @IsEnum(Interval)
  interval: Interval;

  @IsEnum(LevelType)
  type: LevelType;

  @IsOptional()
  @IsString()
  @IsIn(['binance', 'binancefutures'])
  exchange?: string = 'binance';
}
