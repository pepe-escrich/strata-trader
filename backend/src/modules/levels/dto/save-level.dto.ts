import { IsString, IsNumber, IsEnum, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveLevelDto {
  @IsString()
  symbol: string;

  @IsNumber()
  price: number;

  @IsEnum(['pivot', 'fibonacci', 'ichimoku', 'frvp'])
  calculationMethod: string;

  @IsEnum(['1m', '5m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '1w'])
  interval: string;

  @IsEnum(['support', 'resistance', 'neutral'])
  type: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    calculatedAt?: number;
    originalData?: any;
    color?: string;
  };
}

export class SaveLevelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveLevelDto)
  levels: SaveLevelDto[];
}
