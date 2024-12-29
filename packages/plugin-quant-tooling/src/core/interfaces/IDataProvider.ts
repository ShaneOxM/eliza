import { DataSource, TimeFrame, Asset, AssetType } from '../types/index';

export interface IDataProvider {
    /**
     * Unique identifier for the data provider
     */
    readonly id: string;

    /**
     * Type of data source
     */
    readonly source: DataSource;

    /**
     * Initialize the data provider with configuration
     */
    initialize(config: Record<string, any>): Promise<void>;

    /**
     * Get historical price data for an asset
     */
    getPriceHistory(
        asset: Asset,
        timeframe: TimeFrame,
        limit?: number
    ): Promise<PriceData[]>;

    /**
     * Get current market data
     */
    getCurrentMarketData(asset: Asset): Promise<MarketData>;

    /**
     * Subscribe to real-time updates
     */
    subscribeToUpdates(
        asset: Asset,
        callback: (data: MarketData) => void
    ): Promise<void>;

    /**
     * Unsubscribe from updates
     */
    unsubscribe(asset: Asset): Promise<void>;
}

export interface PriceData {
    symbol: string;
    timeframe: TimeFrame;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketData extends PriceData {
    bid: number;
    ask: number;
    bidVolume: number;
    askVolume: number;
    trades: number;
    vwap?: number;
}