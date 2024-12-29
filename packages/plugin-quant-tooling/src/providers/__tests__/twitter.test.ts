import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwitterProvider } from '../twitter';
import type { IAgentRuntime } from '@elizaos/core';

describe('TwitterProvider', () => {
  let provider: TwitterProvider;
  let mockRuntime: IAgentRuntime;

  beforeEach(() => {
    // Create a fresh provider instance
    provider = new TwitterProvider();

    // Mock runtime with test configuration
    mockRuntime = {
      getSetting: vi.fn((key: string) => {
        const settings: { [key: string]: string } = {
          'TWITTER_USERNAME': 'test_bot',
          'TWITTER_PASSWORD': 'test_pass',
          'TWITTER_EMAIL': 'test@example.com',
          'TWITTER_POLL_INTERVAL': '60',
          'INFLUENCERS_CONFIG': JSON.stringify([{
            handle: 'crypto_expert',
            weight: 0.8,
            minEngagement: 100,
            topics: ['$', 'token', 'launch'],
            autoFollow: false
          }, {
            handle: 'trader_pro',
            weight: 0.6,
            minEngagement: 50,
            topics: ['defi', 'nft', 'airdrop'],
            autoFollow: false
          }])
        };
        return settings[key];
      }),
      setSetting: vi.fn(),
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
      },
      providers: {
        get: vi.fn()
      },
      memory: {
        store: vi.fn()
      }
    };
  });

  it('should validate required settings', async () => {
    const isValid = await provider.validate(mockRuntime);
    expect(isValid).toBe(true);
  });

  it('should fail validation with missing settings', async () => {
    mockRuntime.getSetting = vi.fn(() => undefined);
    const isValid = await provider.validate(mockRuntime);
    expect(isValid).toBe(false);
  });

  it('should initialize with valid configuration', async () => {
    await provider.initialize();
    const result = await provider.handler(mockRuntime);
    expect(result).toBeDefined();
  });

  it('should detect relevant tweets based on topics', async () => {
    const mockTweet = {
      text: 'New token launch coming soon! $ABC presale starting next week.',
      likes: 500,
      retweets: 200,
      replies: 100,
      timestamp: Date.now() / 1000,
      permanentUrl: 'https://twitter.com/test/status/123'
    };

    // @ts-ignore - accessing private method for testing
    const isRelevant = provider['isRelevant'](mockTweet, {
      handle: 'test',
      weight: 0.8,
      minEngagement: 100,
      topics: ['token', 'launch', 'presale']
    });

    expect(isRelevant).toBe(true);
  });

  it('should calculate engagement metrics correctly', async () => {
    const mockTweet = {
      text: 'Some tweet text',
      likes: 300,
      retweets: 150,
      replies: 50
    };

    // @ts-ignore - accessing private method for testing
    const hasEngagement = provider['hasMinEngagement'](mockTweet, 400);
    expect(hasEngagement).toBe(true);
  });

  it('should convert tweets to opportunity signals', async () => {
    const mockTweet = {
      text: 'Major partnership announcement! $ABC token launching on Binance.',
      likes: 1000,
      retweets: 500,
      replies: 200,
      timestamp: Date.now() / 1000,
      permanentUrl: 'https://twitter.com/test/status/123'
    };

    // @ts-ignore - accessing private method for testing
    const signal = provider['convertToOpportunitySource'](mockTweet, {
      handle: 'test',
      weight: 0.9,
      minEngagement: 100,
      topics: ['token', 'launch']
    });

    expect(signal).toMatchObject({
      type: 'TWITTER',
      confidence: expect.any(Number),
      data: {
        url: expect.any(String),
        text: expect.any(String),
        metrics: {
          engagement: 1700,
          likes: 1000,
          retweets: 500,
          replies: 200
        }
      }
    });
  });

  it('should handle rate limits and delays', async () => {
    const now = Date.now();
    vi.setSystemTime(now);

    await provider.handler(mockRuntime);
    const secondResult = await provider.handler(mockRuntime);
    expect(secondResult).toBeDefined();

    vi.setSystemTime(now + 30000); // 30 seconds
    const thirdResult = await provider.handler(mockRuntime);
    expect(thirdResult).toBeDefined();

    vi.useRealTimers();
  });
});