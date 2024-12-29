import { Asset, TimeFrame, AnalysisResult } from '../types';
import { PriceData } from './IDataProvider';

export interface IAnalyzer {
    /**
     * Unique identifier for the analyzer
     */
    readonly id: string;

    /**
     * Initialize the analyzer with configuration
     */
    initialize(config: Record<string, any>): Promise<void>;

    /**
     * Analyze market data and generate signals
     */
    analyze(
        asset: Asset,
        data: PriceData[],
        timeframe: TimeFrame
    ): Promise<AnalysisResult>;

    /**
     * Get analyzer-specific metrics
     */
    getMetrics(asset: Asset): Promise<Record<string, number>>;

    /**
     * Update analyzer state with new data
     */
    update(data: PriceData): Promise<void>;

    /**
     * Get analyzer configuration
     */
    getConfig(): Record<string, any>;

    /**
     * Update analyzer configuration
     */
    updateConfig(config: Partial<Record<string, any>>): Promise<void>;
}