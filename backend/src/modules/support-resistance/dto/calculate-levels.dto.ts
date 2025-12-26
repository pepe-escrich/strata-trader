import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum LevelTimeframe {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d',
}

export class CalculateLevelsDto {
  @IsString()
  symbol: string;

  @IsOptional()
  @IsArray()
  @IsEnum(LevelTimeframe, { each: true })
  timeframes?: LevelTimeframe[] = [LevelTimeframe.ONE_HOUR];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(1000)
  limit?: number = 100;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minStrength?: number = 40;
}

export class GetNearbyLevelsDto {
  @IsString()
  symbol: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(5)
  distancePercent?: number = 0.5;

  @IsOptional()
  @IsEnum(LevelTimeframe)
  timeframe?: LevelTimeframe = LevelTimeframe.ONE_HOUR;
}
