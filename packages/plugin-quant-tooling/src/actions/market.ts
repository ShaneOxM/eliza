import { Action, IAgentRuntime, Memory, State } from '@elizaos/core';
import { MarketAnalysis } from '../types/dexscreener';

// Helper function for generating analysis summary
function generateSummary(analysis: MarketAnalysis): string {
  const parts = [
    `${analysis.symbol} Analysis:`,
    `Price: $${analysis.price.current.toFixed(2)} (${analysis.price.change24h > 0 ? '+' : ''}${analysis.price.change24h.toFixed(2)}% 24h)`,
    `Volume 24h: $${analysis.volume.h24.toLocaleString()} (${analysis.volume.trend})`,
    `Liquidity: $${analysis.liquidity.usd.toLocaleString()} (${analysis.liquidity.trend})`,
    `Market Cap: $${analysis.marketCap.toLocaleString()}`,
    `Sentiment: ${analysis.sentiment.trend.toUpperCase()} (Buy/Sell Ratio: ${analysis.sentiment.buyVsSell.toFixed(2)})`
  ];

  if (analysis.signals.length > 0) {
    parts.push('\nSignals:');
    analysis.signals.forEach(signal => {
      const strength = '⚡'.repeat(signal.strength);
      parts.push(`${strength} ${signal.type}: ${signal.direction} - ${signal.reason}`);
    });
  }

  return parts.join('\n');
}

export const marketAnalysisAction: Action = {
  name: 'ANALYZE_MARKET',
  description: 'Analyzes market data and generates trading signals',

  examples: [
    {
      input: "Analyze BTC market conditions",
      output: "Analyzing BTC market data from DEXScreener..."
    },
    {
      input: "What's the market sentiment for ETH?",
      output: "Fetching market sentiment analysis for ETH..."
    }
  ],

  async validate(runtime: IAgentRuntime, message: Memory): Promise<boolean> {
    // Extract symbol from message or use default
    const symbol = message.content?.symbol || 'BTC';

    try {
      // Verify we can fetch data for this symbol
      const provider = runtime.providers?.get('DEX_SCREENER');
      if (!provider) {
        runtime.logger.error('DEXScreener provider not found');
        return false;
      }

      return true;
    } catch (error) {
      runtime.logger.error('Market analysis validation failed:', error);
      return false;
    }
  },

  async handler(
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    params: any
  ): Promise<boolean> {
    try {
      const symbol = message.content?.symbol || params?.symbol || 'BTC';

      // Store the current symbol in runtime settings
      runtime.setSetting('currentSymbol', symbol);

      // Get market data from provider
      const provider = runtime.providers.get('DEX_SCREENER');
      const result = await provider.handler(runtime);

      if (!result || !result.content) {
        throw new Error('No market data available');
      }

      const analysis = result.content as MarketAnalysis;

      // Store analysis in memory
      await runtime.memory.store({
        type: 'ANALYSIS_RESULT',
        content: {
          symbol: analysis.symbol,
          timestamp: analysis.timestamp,
          summary: generateSummary(analysis),
          signals: analysis.signals
        }
      });

      return true;
    } catch (error) {
      runtime.logger.error('Market analysis failed:', error);
      return false;
    }
  }
};