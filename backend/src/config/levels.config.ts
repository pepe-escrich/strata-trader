import { registerAs } from '@nestjs/config';

export default registerAs('levels', () => ({
  strengthCalculation: {
    candles: parseInt(process.env.STRENGTH_CALC_CANDLES) || 500,
    threshold: parseFloat(process.env.STRENGTH_CALC_THRESHOLD) || 0.001,
    cacheTTL: parseInt(process.env.STRENGTH_CALC_CACHE_TTL) || 3600000, // 1 hour in ms
  },
}));
