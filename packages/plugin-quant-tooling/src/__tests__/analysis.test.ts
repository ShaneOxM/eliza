import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AnalysisService } from '../services/analysis';
import { IAgentRuntime, ServiceType, MessageManager } from '@elizaos/core';
import { SignalType, SignalAction, SignalStrength, TimeFrame } from '../core/types';
import { PriceData } from '../core/interfaces/IDataProvider';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let mockRuntime: IAgentRuntime;

  beforeAll(() => {
    mockRuntime = {
      getService: vi.fn(),
      getState: vi.fn(),
      getMessageManager: vi.fn(),
      getSetting: vi.fn(),
      composeState: vi.fn(),
      updateRecentMessageState: vi.fn(),
      messageManager: {} as MessageManager
    } as IAgentRuntime;

    service = new AnalysisService(mockRuntime);
  });

  it('should analyze market data', async () => {
    const testData: PriceData = {
      symbol: 'BTC/USDT',
      timeframe: TimeFrame.HOUR_1,
      timestamp: 1709251200000,
      open: 62000,
      high: 62500,
      low: 61800,
      close: 62300,
      volume: 1000
    };

    const result = await service.analyze(testData);
    expect(result).toBeDefined();
    expect(result.timestamp).toBe(testData.timestamp);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.rsi).toBeDefined();
    expect(result.metrics.sma).toBeDefined();
    expect(result.metrics.bollinger_bands).toBeDefined();
    expect(result.metrics.macd).toBeDefined();
    expect(result.metrics.stochastic).toBeDefined();
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('should generate RSI signals', async () => {
    const overboughtData: PriceData = {
      symbol: 'BTC/USDT',
      timeframe: TimeFrame.HOUR_1,
      timestamp: 1709251200000,
      open: 62000,
      high: 62500,
      low: 61800,
      close: 62300,
      volume: 1000
    };

    const result = await service.analyze(overboughtData);
    const rsiSignal = result.signals.find(s => s.type === SignalType.RSI);

    if (result.metrics.rsi && result.metrics.rsi > 70) {
      expect(rsiSignal).toBeDefined();
      expect(rsiSignal?.action).toBe(SignalAction.SELL);
      expect(rsiSignal?.strength).toBe(SignalStrength.STRONG);
    } else if (result.metrics.rsi && result.metrics.rsi < 30) {
      expect(rsiSignal).toBeDefined();
      expect(rsiSignal?.action).toBe(SignalAction.BUY);
      expect(rsiSignal?.strength).toBe(SignalStrength.STRONG);
    }
  });

  it('should handle errors gracefully', async () => {
    const invalidData: PriceData = {
      symbol: 'INVALID',
      timeframe: TimeFrame.HOUR_1,
      timestamp: 0,
      open: NaN,
      high: NaN,
      low: NaN,
      close: NaN,
      volume: 0
    };

    await expect(service.analyze(invalidData)).rejects.toThrow();
  });
});