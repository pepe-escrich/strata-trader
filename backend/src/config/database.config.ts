import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/strata-trader',
  user: process.env.MONGODB_USER,
  password: process.env.MONGODB_PASSWORD,
}));
