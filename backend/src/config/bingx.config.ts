import { registerAs } from '@nestjs/config';

export default registerAs('bingx', () => ({
  apiKey: process.env.BINGX_API_KEY,
  secretKey: process.env.BINGX_SECRET_KEY,
  baseUrl: process.env.BINGX_BASE_URL || 'https://open-api.bingx.com',
  testnet: process.env.BINGX_TESTNET === 'true',
  timeout: 10000,
  retryAttempts: 3,
}));
