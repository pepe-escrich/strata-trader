import { registerAs } from '@nestjs/config';

export default registerAs('trading', () => ({
  defaultRiskPercent: parseFloat(process.env.DEFAULT_RISK_PERCENT) || 1,
  maxLeverage: parseInt(process.env.MAX_LEVERAGE, 10) || 20,
  maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS, 10) || 3,
  maxDailyLossPercent: parseFloat(process.env.MAX_DAILY_LOSS_PERCENT) || 5,

  market: {
    updateInterval: parseInt(process.env.MARKET_UPDATE_INTERVAL, 10) || 5000,
    candleCacheTTL: parseInt(process.env.CANDLE_CACHE_TTL, 10) || 300000,
  },

  levels: {
    updateInterval: parseInt(process.env.LEVELS_UPDATE_INTERVAL, 10) || 60000,
    minStrength: parseInt(process.env.MIN_LEVEL_STRENGTH, 10) || 40,
    maxDistancePercent: parseFloat(process.env.MAX_LEVEL_DISTANCE_PERCENT) || 0.5,
  },

  divergence: {
    scanInterval: parseInt(process.env.DIV_SCAN_INTERVAL, 10) || 30000,
    minScore: parseInt(process.env.MIN_DIVERGENCE_SCORE, 10) || 50,
    requiredIndicators: parseInt(process.env.REQUIRED_INDICATORS, 10) || 1,
  },

  backtesting: {
    defaultCapital: parseInt(process.env.BACKTEST_DEFAULT_CAPITAL, 10) || 10000,
    commissionPercent: parseFloat(process.env.BACKTEST_COMMISSION_PERCENT) || 0.075,
    slippagePercent: parseFloat(process.env.BACKTEST_SLIPPAGE_PERCENT) || 0.05,
  },
}));
