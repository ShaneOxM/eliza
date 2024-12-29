# Data Provider Integration Guide

## Overview

This guide explains how to implement and integrate new data providers into the ElizaOS quantitative trading toolkit. Data providers are responsible for fetching market data from various sources and converting it into a standardized format for analysis.

## Implementation Steps

### 1. Create Provider Class

Create a new file in `src/data/providers/` following the naming convention `[provider]Provider.ts`:

```typescript
import { IDataProvider } from '../../core/interfaces/IDataProvider';
import { PriceData, DataParams, TimeFrame } from '../../core/types';

export class NewExchangeProvider implements IDataProvider {
  constructor(config: any) {
    // Initialize provider with configuration
  }

  async fetchData(params: DataParams): Promise<PriceData> {
    // Implement data fetching logic
    return {
      symbol: params.symbol,
      timeframe: params.timeframe,
      timestamp: Date.now(),
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0
    };
  }
}
```

### 2. Implement Required Methods

The `IDataProvider` interface requires:

```typescript
interface IDataProvider {
  fetchData(params: DataParams): Promise<PriceData>;
  // Optional methods
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  isConnected?(): boolean;
}
```

### 3. Error Handling

Implement proper error handling:

```typescript
async fetchData(params: DataParams): Promise<PriceData> {
  try {
    // Fetch data from source
    const rawData = await this.fetchFromSource(params);

    // Validate data
    if (!this.isValidData(rawData)) {
      throw new Error('Invalid data received from source');
    }

    // Transform to PriceData format
    return this.transformData(rawData);
  } catch (error) {
    throw new Error(`Data fetch failed: ${error.message}`);
  }
}
```

### 4. Data Validation

Implement validation methods:

```typescript
private isValidData(data: any): boolean {
  return (
    typeof data === 'object' &&
    typeof data.price === 'number' &&
    typeof data.timestamp === 'number'
    // Add more validation as needed
  );
}
```

### 5. Data Transformation

Create methods to transform provider-specific data:

```typescript
private transformData(rawData: any): PriceData {
  return {
    symbol: rawData.symbol,
    timeframe: this.mapTimeframe(rawData.interval),
    timestamp: rawData.timestamp,
    open: parseFloat(rawData.open),
    high: parseFloat(rawData.high),
    low: parseFloat(rawData.low),
    close: parseFloat(rawData.close),
    volume: parseFloat(rawData.volume)
  };
}

private mapTimeframe(providerInterval: string): TimeFrame {
  const mappings = {
    '1m': TimeFrame.MINUTE_1,
    '1h': TimeFrame.HOUR_1,
    '1d': TimeFrame.DAY_1
    // Add more mappings
  };
  return mappings[providerInterval] || TimeFrame.HOUR_1;
}
```

## Registration and Usage

### 1. Register Provider

Add the provider to the data service registry:

```typescript
// src/services/data.ts
import { NewExchangeProvider } from '../data/providers/newExchangeProvider';

export class DataService extends Service {
  private providers: Map<string, IDataProvider> = new Map();

  constructor(runtime: IAgentRuntime) {
    super(ServiceType.DATA);
    this.registerProvider('newexchange', new NewExchangeProvider(config));
  }

  registerProvider(name: string, provider: IDataProvider) {
    this.providers.set(name, provider);
  }
}
```

### 2. Configuration

Add provider configuration to your agent:

```json
{
  "services": {
    "DATA": {
      "providers": {
        "newexchange": {
          "apiKey": "your-api-key",
          "apiSecret": "your-api-secret"
        }
      }
    }
  }
}
```

### 3. Usage Example

```typescript
const dataService = runtime.getService(ServiceType.DATA);
const data = await dataService.fetchData({
  provider: 'newexchange',
  symbol: 'BTC/USDT',
  timeframe: TimeFrame.HOUR_1
});
```

## Best Practices

1. **Rate Limiting**
   - Implement rate limiting
   - Cache frequently requested data
   - Handle API quotas

2. **Error Recovery**
   - Implement retry logic
   - Handle network errors
   - Log errors appropriately

3. **Data Quality**
   - Validate all incoming data
   - Handle missing data points
   - Implement data normalization

4. **Performance**
   - Optimize data fetching
   - Implement caching
   - Use connection pooling

## Testing

Create comprehensive tests:

```typescript
describe('NewExchangeProvider', () => {
  let provider: NewExchangeProvider;

  beforeEach(() => {
    provider = new NewExchangeProvider(config);
  });

  it('should fetch valid price data', async () => {
    const data = await provider.fetchData({
      symbol: 'BTC/USDT',
      timeframe: TimeFrame.HOUR_1
    });

    expect(data).toBeDefined();
    expect(data.symbol).toBe('BTC/USDT');
    expect(typeof data.close).toBe('number');
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

## Common Issues

1. **API Changes**
   - Monitor for API updates
   - Version handling
   - Backward compatibility

2. **Data Consistency**
   - Time zone handling
   - Decimal precision
   - Symbol naming conventions

3. **Connection Issues**
   - Connection pooling
   - Timeout handling
   - Reconnection logic