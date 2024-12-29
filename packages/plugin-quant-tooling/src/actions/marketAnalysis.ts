import { Action, IAgentRuntime, Memory, State, ServiceType } from '@elizaos/core';
import { Asset, TimeFrame, AnalysisResult } from '../core/types';
import { AnalysisService } from '../services/analysis';
import { PriceData } from '../core/interfaces/IDataProvider';

export interface MarketAnalysisParams {
    asset: Asset;
    timeframe: TimeFrame;
}

export const marketAnalysisAction: Action = {
    name: 'MARKET_ANALYSIS',
    description: 'Analyze market data and generate signals',
    examples: [
        {
            input: 'Analyze BTC market conditions',
            output: JSON.stringify({
                asset: {
                    symbol: 'BTC/USD',
                    name: 'Bitcoin',
                    type: 'SPOT'
                },
                timeframe: '1h'
            })
        }
    ],

    async validate(runtime: IAgentRuntime, message: Memory): Promise<boolean> {
        // Validate that we have necessary services
        const analysisService = runtime.getService(ServiceType.ANALYSIS) as AnalysisService;
        return !!analysisService;
    },

    async handler(
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        params: MarketAnalysisParams
    ): Promise<AnalysisResult> {
        const analysisService = runtime.getService(ServiceType.ANALYSIS) as AnalysisService;
        if (!analysisService) {
            throw new Error('Analysis service not available');
        }

        try {
            // Mock market data for now - TODO: Get from data provider
            const marketData: PriceData = {
                symbol: params.asset.symbol,
                timeframe: params.timeframe,
                timestamp: Date.now(),
                open: 0,
                high: 0,
                low: 0,
                close: 0,
                volume: 0
            };

            // Run analysis
            const result = await analysisService.analyze(marketData);

            // Store results in memory
            await runtime.messageManager.createMemory({
                id: `analysis-${Date.now()}`,
                content: { result },
                userId: message.userId,
                roomId: message.roomId
            });

            return result;
        } catch (error) {
            console.error('Market analysis failed:', error);
            throw error;
        }
    }
};