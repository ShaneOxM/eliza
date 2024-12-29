import { Action, IAgentRuntime, Memory, State } from '@elizaos/core';
import { Opportunity, OpportunitySource } from '../types/opportunity';
import { MarketAnalysis } from '../types/dexscreener';

function generateOpportunityId(source: OpportunitySource): string {
  return `${source.type}_${source.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateScore(sources: OpportunitySource[], marketData?: MarketAnalysis): {
  social: number;
  technical: number;
  overall: number;
} {
  const socialScore = sources
    .filter(s => s.type === 'TWITTER')
    .reduce((acc, s) => acc + (s.confidence * 100), 0) / sources.length;

  const technicalScore = marketData ?
    (marketData.signals.length * 25) +
    (marketData.volume.h24 > 100000 ? 25 : 0) +
    (marketData.liquidity.usd > 50000 ? 25 : 0) +
    (marketData.price.change24h > 0 ? 25 : 0) : 0;

  return {
    social: Math.min(socialScore, 100),
    technical: Math.min(technicalScore, 100),
    overall: Math.min((socialScore + technicalScore) / 2, 100)
  };
}

export const opportunityDetectionAction: Action = {
  name: 'DETECT_OPPORTUNITIES',
  description: 'Analyzes social signals and market data to detect trading opportunities',

  examples: [
    {
      input: "Look for new opportunities in the market",
      output: "Analyzing social signals and market data for potential opportunities..."
    }
  ],

  async validate(runtime: IAgentRuntime, message: Memory): Promise<boolean> {
    const twitterProvider = runtime.providers?.get('TWITTER');
    const dexScreenerProvider = runtime.providers?.get('DEX_SCREENER');

    return !!(twitterProvider && dexScreenerProvider);
  },

  async handler(
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    params: any
  ): Promise<boolean> {
    try {
      // Get social signals
      const twitterProvider = runtime.providers.get('TWITTER');
      const socialResult = await twitterProvider.handler(runtime);

      if (!socialResult?.content) {
        throw new Error('No social signals available');
      }

      const signals: OpportunitySource[] = socialResult.content;

      // Group signals by symbol/project
      const opportunitiesBySymbol = new Map<string, OpportunitySource[]>();

      signals.forEach(signal => {
        // Extract symbol from signal (implementation needed)
        const symbol = 'PLACEHOLDER';  // TODO: Implement symbol extraction
        const existing = opportunitiesBySymbol.get(symbol) || [];
        opportunitiesBySymbol.set(symbol, [...existing, signal]);
      });

      // Analyze each potential opportunity
      const opportunities: Opportunity[] = [];

      for (const [symbol, sources] of opportunitiesBySymbol) {
        // Get market data
        runtime.setSetting('currentSymbol', symbol);
        const dexScreenerProvider = runtime.providers.get('DEX_SCREENER');
        const marketResult = await dexScreenerProvider.handler(runtime);

        if (!marketResult?.content) continue;

        const marketData = marketResult.content as MarketAnalysis;
        const scores = calculateScore(sources, marketData);

        // Create opportunity if scores meet thresholds
        if (scores.overall >= 60) {  // Minimum threshold
          const opportunity: Opportunity = {
            id: generateOpportunityId(sources[0]),
            symbol,
            chain: 'ETH',  // TODO: Implement chain detection
            timestamp: Date.now(),
            sources,
            score: scores,
            analysis: {
              summary: `Found potential opportunity in ${symbol} with strong social signals and market indicators`,
              signals: marketData.signals,
              risks: [
                'High volatility potential',
                'Limited trading history',
                'Unverified social signals'
              ]
            },
            status: 'NEW',
            lastUpdated: Date.now()
          };

          opportunities.push(opportunity);
        }
      }

      // Store opportunities in memory
      await runtime.memory.store({
        type: 'OPPORTUNITIES',
        content: {
          timestamp: Date.now(),
          opportunities
        }
      });

      return true;
    } catch (error) {
      runtime.logger?.error('Opportunity detection failed:', error);
      return false;
    }
  }
};