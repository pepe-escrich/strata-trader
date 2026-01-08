import { registerAs } from '@nestjs/config';

export default registerAs('taapi', () => ({
  apiKey: process.env.TAAPI_API_KEY || '',
  baseUrl: process.env.TAAPI_BASE_URL || 'https://api.taapi.io',
  timeout: parseInt(process.env.TAAPI_TIMEOUT || '10000', 10),
}));
