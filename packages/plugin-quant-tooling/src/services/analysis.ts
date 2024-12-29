import { Service, ServiceType, IAgentRuntime } from '@elizaos/core';
import { RSI, SMA, MACD, BollingerBands, Stochastic } from 'technicalindicators';
import { PriceData } from '../core/interfaces/IDataProvider';
import { AnalysisResult, SignalType, SignalAction, SignalStrength, Signal } from '../core/types';

export class AnalysisService extends Service {
  constructor(runtime: IAgentRuntime) {
    super(ServiceType.ANALYSIS);
  }

  async analyze(data: PriceData): Promise<AnalysisResult> {
    try {
      // Validate input data
      if (isNaN(data.open) || isNaN(data.high) || isNaN(data.low) || isNaN(data.close)) {
        throw new Error('Invalid price data: contains NaN values');
      }

      // Calculate indicators
      const rsi = RSI.calculate({
        values: [data.close],
        period: 14
      });

      const sma = SMA.calculate({
        values: [data.close],
        period: 20
      });

      const macd = MACD.calculate({
        values: [data.close],
        SimpleMAOscillator: true,
        SimpleMASignal: true,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9
      });

      const bb = BollingerBands.calculate({
        values: [data.close],
        period: 20,
        stdDev: 2
      });

      const stoch = Stochastic.calculate({
        high: [data.high],
        low: [data.low],
        close: [data.close],
        period: 14,
        signalPeriod: 3
      });

      return {
        timestamp: data.timestamp,
        metrics: {
          rsi: rsi[0] || null,
          sma: sma[0] || null,
          bollinger_bands: {
            upper: bb[0]?.upper || null,
            middle: bb[0]?.middle || null,
            lower: bb[0]?.lower || null
          },
          macd: {
            macd: macd[0]?.MACD || null,
            signal: macd[0]?.signal || null,
            histogram: macd[0]?.histogram || null
          },
          stochastic: {
            k: stoch[0]?.k || null,
            d: stoch[0]?.d || null
          }
        },
        signals: this.generateSignals({
          rsi: rsi[0],
          macd: macd[0],
          bb: bb[0],
          stoch: stoch[0]
        })
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  private generateSignals(indicators: any): Signal[] {
    const signals: Signal[] = [];

    // RSI signals
    if (indicators.rsi) {
      if (indicators.rsi > 70) {
        signals.push({
          type: SignalType.RSI,
          action: SignalAction.SELL,
          strength: SignalStrength.STRONG
        });
      } else if (indicators.rsi < 30) {
        signals.push({
          type: SignalType.RSI,
          action: SignalAction.BUY,
          strength: SignalStrength.STRONG
        });
      }
    }

    // MACD signals
    if (indicators.macd) {
      if (indicators.macd.histogram > 0 && indicators.macd.histogram > indicators.macd.signal) {
        signals.push({
          type: SignalType.MACD,
          action: SignalAction.BUY,
          strength: SignalStrength.MEDIUM
        });
      } else if (indicators.macd.histogram < 0 && indicators.macd.histogram < indicators.macd.signal) {
        signals.push({
          type: SignalType.MACD,
          action: SignalAction.SELL,
          strength: SignalStrength.MEDIUM
        });
      }
    }

    // Stochastic signals
    if (indicators.stoch) {
      if (indicators.stoch.k > 80 && indicators.stoch.d > 80) {
        signals.push({
          type: SignalType.STOCH,
          action: SignalAction.SELL,
          strength: SignalStrength.MEDIUM
        });
      } else if (indicators.stoch.k < 20 && indicators.stoch.d < 20) {
        signals.push({
          type: SignalType.STOCH,
          action: SignalAction.BUY,
          strength: SignalStrength.MEDIUM
        });
      }
    }

    return signals;
  }
}