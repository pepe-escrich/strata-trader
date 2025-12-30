export interface CryptoPair {
  symbol: string;
  name: string;
  icon: string;
  gradient: string;
  color: string;
  enabled: boolean;
}

export const DEFAULT_PAIRS: CryptoPair[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    icon: '₿',
    gradient: 'linear-gradient(135deg, #f7931a 0%, #f7b733 100%)',
    color: '#f7931a',
    enabled: true
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    icon: 'Ξ',
    gradient: 'linear-gradient(135deg, #627eea 0%, #8c9eff 100%)',
    color: '#627eea',
    enabled: true
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana',
    icon: '◎',
    gradient: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    color: '#9945ff',
    enabled: true
  },
  {
    symbol: 'BNBUSDT',
    name: 'BNB',
    icon: 'B',
    gradient: 'linear-gradient(135deg, #f3ba2f 0%, #ffd54f 100%)',
    color: '#f3ba2f',
    enabled: true
  },
  {
    symbol: 'XRPUSDT',
    name: 'Ripple',
    icon: 'X',
    gradient: 'linear-gradient(135deg, #23292f 0%, #4a5568 100%)',
    color: '#23292f',
    enabled: false
  },
  {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    icon: 'A',
    gradient: 'linear-gradient(135deg, #0033ad 0%, #3b82f6 100%)',
    color: '#0033ad',
    enabled: false
  }
];
