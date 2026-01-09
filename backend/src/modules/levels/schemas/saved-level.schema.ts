import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SavedLevelDocument = SavedLevel & Document;

@Schema({ timestamps: true })
export class SavedLevel {
  @Prop({ required: true, index: true })
  symbol: string; // e.g., "BTCUSDT"

  @Prop({ required: true })
  price: number; // The level price

  @Prop({ required: true, enum: ['pivot', 'fibonacci', 'ichimoku', 'frvp'] })
  calculationMethod: string; // How it was calculated

  @Prop({ required: true, enum: ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '12h', '1d', '1w'] })
  interval: string; // Timeframe used for calculation

  @Prop({ required: true, enum: ['support', 'resistance', 'neutral'] })
  type: string; // Support or Resistance

  @Prop({ required: true })
  label: string; // e.g., "R3", "61.8%", "Tenkan"

  @Prop({ default: 0 })
  touchCount: number; // Number of times price touched this level

  @Prop({ default: 0 })
  strength: number; // Calculated strength score (0-100)

  @Prop({ type: Object })
  metadata: {
    calculatedAt: number; // Timestamp of calculation
    originalData?: any; // Full original data from TAAPI
    color?: string; // Chart display color
  };

  @Prop({ default: Date.now })
  lastTouchCalculation: Date; // When touches were last calculated
}

export const SavedLevelSchema = SchemaFactory.createForClass(SavedLevel);

// Compound indexes for efficient queries
SavedLevelSchema.index({ symbol: 1, price: 1 });
SavedLevelSchema.index({ symbol: 1, calculationMethod: 1, interval: 1 });
