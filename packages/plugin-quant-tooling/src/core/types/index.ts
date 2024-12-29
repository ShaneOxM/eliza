export enum DataSource {
    BINANCE = 'BINANCE',
    COINBASE = 'COINBASE',
    KRAKEN = 'KRAKEN'
}

export enum TimeFrame {
    MINUTE_1 = '1m',
    MINUTE_5 = '5m',
    MINUTE_15 = '15m',
    MINUTE_30 = '30m',
    HOUR_1 = '1h',
    HOUR_4 = '4h',
    DAY_1 = '1d',
    WEEK_1 = '1w'
}

export enum AssetType {
    SPOT = 'SPOT',
    FUTURES = 'FUTURES',
    OPTIONS = 'OPTIONS'
}

export interface Asset {
    symbol: string;
    name: string;
    type: AssetType;
}

export enum SignalType {
    RSI = 'RSI',
    MACD = 'MACD',
    STOCH = 'STOCH'
}

export enum SignalAction {
    BUY = 'BUY',
    SELL = 'SELL'
}

export enum SignalStrength {
    WEAK = 'WEAK',
    MEDIUM = 'MEDIUM',
    STRONG = 'STRONG'
}

export interface Signal {
    type: SignalType;
    action: SignalAction;
    strength: SignalStrength;
}

export interface AnalysisMetrics {
    rsi: number | null;
    sma: number | null;
    bollinger_bands: {
        upper: number | null;
        middle: number | null;
        lower: number | null;
    };
    macd: {
        macd: number | null;
        signal: number | null;
        histogram: number | null;
    };
    stochastic: {
        k: number | null;
        d: number | null;
    };
}

export interface AnalysisResult {
    timestamp: number;
    metrics: AnalysisMetrics;
    signals: Signal[];
}