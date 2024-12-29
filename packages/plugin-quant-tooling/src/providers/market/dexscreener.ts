import { Provider, IAgentRuntime } from '@elizaos/core';

interface DexScreenerApiResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

import { DexScreenerData, DexScreenerPair, MarketAnalysis } from '../../types/dexscreener';

export class DexScreenerProvider implements Provider {
  private cache: Map<string, { data: DexScreenerData; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
  }

  async initialize() {
    // Clear cache on initialization
    this.cache.clear();
  }

  async validate(runtime: IAgentRuntime) {
    try {
      const testData = await this.fetchDexScreenerData('BTC');
      return testData.pairs.length > 0;
    } catch (error) {
      runtime.logger?.error('DexScreener validation failed:', error);
      return false;
    }
  }

  async handler(runtime: IAgentRuntime) {
    try {
      // Get the symbol from the message or context
      const symbol = runtime.getSetting('currentSymbol') || 'BTC';
      const analysis = await this.analyzeMarket(symbol);

      return {
        type: 'MARKET_DATA',
        content: analysis
      };
    } catch (error) {
      runtime.logger?.error('DexScreener handler failed:', error);
      return null;
    }
  }

  private async fetchDexScreenerData(symbol: string): Promise<DexScreenerData> {
    const cacheKey = `dexscreener_${symbol.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const url = `https://api.dexscreener.com/latest/dex/search?q=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.statusText}`);
    }

    const data = (await response.json()) as DexScreenerApiResponse;

    if (!data || !data.pairs) {
      throw new Error('Invalid DexScreener response');
    }

    const dexData: DexScreenerData = {
      schemaVersion: data.schemaVersion,
      pairs: data.pairs
    };

    this.cache.set(cacheKey, {
      data: dexData,
      timestamp: Date.now()
    });

    return dexData;
  }

  private async analyzeMarket(symbol: string): Promise<MarketAnalysis> {
    const data = await this.fetchDexScreenerData(symbol);
    const pair = this.getHighestLiquidityPair(data);

    if (!pair) {
      throw new Error(`No valid pair found for ${symbol}`);
    }

    return {
      symbol,
      timestamp: Date.now(),
      price: {
        current: parseFloat(pair.priceUsd),
        change24h: pair.priceChange.h24
      },
      volume: {
        h24: pair.volume.h24,
        trend: this.analyzeTrend([pair.volume.m5, pair.volume.h1, pair.volume.h6, pair.volume.h24])
      },
      liquidity: {
        usd: pair.liquidity.usd,
        trend: this.analyzeTrend([pair.liquidity.usd]) // Would need historical data for better trend analysis
      },
      sentiment: {
        buyVsSell: this.calculateBuySellRatio(pair.txns.h24),
        trend: this.analyzeSentiment(pair)
      },
      marketCap: pair.marketCap,
      signals: this.generateSignals(pair)
    };
  }

  private getHighestLiquidityPair(data: DexScreenerData): DexScreenerPair | null {
    if (!data.pairs.length) return null;
    return data.pairs.sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
  }

  private analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    const change = ((values[0] - values[values.length - 1]) / values[values.length - 1]) * 100;
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  private calculateBuySellRatio(txns: { buys: number; sells: number }): number {
    if (txns.sells === 0) return txns.buys > 0 ? Infinity : 1;
    return txns.buys / txns.sells;
  }

  private analyzeSentiment(pair: DexScreenerPair): 'bullish' | 'bearish' | 'neutral' {
    const buyRatio = this.calculateBuySellRatio(pair.txns.h24);
    const priceChange = pair.priceChange.h24;

    if (buyRatio > 1.2 && priceChange > 0) return 'bullish';
    if (buyRatio < 0.8 && priceChange < 0) return 'bearish';
    return 'neutral';
  }

  private generateSignals(pair: DexScreenerPair): MarketAnalysis['signals'] {
    const signals: MarketAnalysis['signals'] = [];

    // Price signal
    if (Math.abs(pair.priceChange.h24) > 10) {
      signals.push({
        type: 'PRICE',
        strength: 3,
        direction: pair.priceChange.h24 > 0 ? 'BUY' : 'SELL',
        reason: `Large price movement of ${pair.priceChange.h24.toFixed(2)}% in 24h`
      });
    }

    // Volume signal
    const volumeChange = ((pair.volume.h24 - pair.volume.h1 * 24) / (pair.volume.h1 * 24)) * 100;
    if (Math.abs(volumeChange) > 50) {
      signals.push({
        type: 'VOLUME',
        strength: 2,
        direction: volumeChange > 0 ? 'BUY' : 'SELL',
        reason: `Significant volume change of ${volumeChange.toFixed(2)}%`
      });
    }

    // Sentiment signal
    const buyRatio = this.calculateBuySellRatio(pair.txns.h24);
    if (Math.abs(buyRatio - 1) > 0.3) {
      signals.push({
        type: 'SENTIMENT',
        strength: 2,
        direction: buyRatio > 1 ? 'BUY' : 'SELL',
        reason: `Strong ${buyRatio > 1 ? 'buying' : 'selling'} pressure with ${buyRatio.toFixed(2)} buy/sell ratio`
      });
    }

    return signals;
  }
}