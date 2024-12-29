import { Plugin, IAgentRuntime } from '@elizaos/core';
import { marketAnalysisAction } from './actions/market';
import { opportunityDetectionAction } from './actions/opportunity';
import { DexScreenerProvider } from './providers/market/dexscreener';
import { TwitterProvider } from './providers/twitter';

export const quantPlugin: Plugin = {
  name: '@elizaos/plugin-quant-tooling',
  description: 'Quantitative analysis tools for crypto markets',

  actions: [
    marketAnalysisAction,
    opportunityDetectionAction
  ],

  providers: [
    new DexScreenerProvider(),
    new TwitterProvider()
  ],

  async initialize(runtime: IAgentRuntime) {
    try {
      // Initialize providers
      const providers = {
        dexScreener: this.providers?.find(p => p instanceof DexScreenerProvider) as DexScreenerProvider,
        twitter: this.providers?.find(p => p instanceof TwitterProvider) as TwitterProvider
      };

      if (!providers.dexScreener || !providers.twitter) {
        throw new Error('Required providers not found');
      }

      // Initialize each provider
      await Promise.all([
        providers.dexScreener.initialize(),
        providers.twitter.initialize()
      ]);

      // Configure Twitter provider
      const influencersConfig = runtime.getSetting('INFLUENCERS_CONFIG');
      if (influencersConfig) {
        try {
          const config = JSON.parse(influencersConfig);
          if (!Array.isArray(config)) {
            throw new Error('INFLUENCERS_CONFIG must be an array');
          }

          // Validate and add each influencer
          for (const inf of config) {
            if (!inf.handle) {
              runtime.logger?.error('Invalid influencer config:', inf);
              continue;
            }

            // Configure the provider directly
            await providers.twitter.handler(runtime);
          }
        } catch (error) {
          runtime.logger?.error('Failed to parse influencer configuration:', error);
        }
      }

      runtime.logger?.info('Quant tooling plugin initialized successfully');
    } catch (error) {
      runtime.logger?.error('Failed to initialize quant tooling plugin:', error);
      throw error;
    }
  },

  async cleanup() {
    // No cleanup needed
  }
};