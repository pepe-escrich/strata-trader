import { IsOptional, IsEnum } from 'class-validator';

export class GetSavedLevelsDto {
  @IsOptional()
  @IsEnum(['pivot', 'fibonacci', 'ichimoku', 'frvp'])
  calculationMethod?: string;

  @IsOptional()
  @IsEnum(['1m', '5m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '1w'])
  interval?: string;

  @IsOptional()
  @IsEnum(['support', 'resistance', 'neutral'])
  type?: string;
}
