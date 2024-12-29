export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
}

export interface DexScreenerData {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

export interface MarketAnalysis {
  symbol: string;
  timestamp: number;
  price: {
    current: number;
    change24h: number;
  };
  volume: {
    h24: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  liquidity: {
    usd: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  sentiment: {
    buyVsSell: number;  // Ratio of buys to sells
    trend: 'bullish' | 'bearish' | 'neutral';
  };
  marketCap: number;
  signals: Array<{
    type: 'PRICE' | 'VOLUME' | 'LIQUIDITY' | 'SENTIMENT';
    strength: 1 | 2 | 3;  // 1 = weak, 2 = medium, 3 = strong
    direction: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
  }>;
}