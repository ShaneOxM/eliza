import { Provider, IAgentRuntime } from '@elizaos/core';
import TwitterManager from '@elizaos/client-twitter';
import { Influencer, OpportunitySource } from '../types/opportunity';

interface InfluencerConfig {
  handle: string;
  weight?: number;
  minEngagement?: number;
  topics?: string[];
  autoFollow?: boolean;
}

export class TwitterProvider implements Provider {
  private manager: any | null = null;
  private influencers: Map<string, Influencer>;
  private readonly POLL_INTERVAL = 120; // 2 minutes

  // Default values for simple configuration
  private readonly DEFAULT_WEIGHT = 0.7;
  private readonly DEFAULT_MIN_ENGAGEMENT = 50;
  private readonly DEFAULT_TOPICS = ['defi', 'crypto', 'web3', 'nft'];

  constructor() {
    this.influencers = new Map();
  }

  async initialize() {
    // Clear any existing state
    this.influencers.clear();
  }

  async validate(runtime: IAgentRuntime) {
    try {
      const requiredSettings = ['TWITTER_USERNAME', 'TWITTER_PASSWORD', 'TWITTER_EMAIL'];
      return requiredSettings.every(key => !!runtime.getSetting(key));
    } catch (error) {
      runtime.logger?.error('Twitter validation failed:', error);
      return false;
    }
  }

  async handler(runtime: IAgentRuntime) {
    try {
      // Initialize Twitter client if not already initialized
      if (!this.manager) {
        this.manager = await TwitterManager.start(runtime, false); // false to disable search mode
        console.log('Twitter client initialized');

        // Start monitoring loop
        this.startMonitoring(runtime);
      }

      // Load influencers first
      await this.loadInfluencersFromEnv(runtime);

      // Process feeds and return signals
      const signals = await this.processFeeds(runtime);
      return signals;
    } catch (error) {
      console.error('Failed to handle Twitter provider:', error);
      throw error;
    }
  }

  private async startMonitoring(runtime: IAgentRuntime) {
    const interval = Number(runtime.getSetting('TWITTER_POLL_INTERVAL') || this.POLL_INTERVAL) * 1000;

    const monitor = async () => {
      try {
        await this.loadInfluencersFromEnv(runtime);
        await this.processFeeds(runtime);
      } catch (error) {
        console.error('Error in Twitter monitoring:', error);
      }

      setTimeout(() => monitor(), interval);
    };

    monitor();
  }

  private async loadInfluencersFromEnv(runtime: IAgentRuntime) {
    // Load from JSON config if available
    const jsonConfig = runtime.getSetting('INFLUENCERS_CONFIG');
    if (jsonConfig) {
      try {
        const config = JSON.parse(jsonConfig);
        for (const inf of config) {
          await this.addInfluencer({
            handle: inf.handle,
            weight: inf.weight ?? this.DEFAULT_WEIGHT,
            minEngagement: inf.minEngagement ?? this.DEFAULT_MIN_ENGAGEMENT,
            topics: inf.topics ?? this.DEFAULT_TOPICS,
            autoFollow: inf.autoFollow ?? true
          });
        }
      } catch (error) {
        console.error('Failed to parse JSON influencer config:', error);
      }
    }
  }

  private async addInfluencer(config: InfluencerConfig) {
    if (!this.manager) return;

    const influencer: Influencer = {
      handle: config.handle,
      weight: config.weight ?? this.DEFAULT_WEIGHT,
      minEngagement: config.minEngagement ?? this.DEFAULT_MIN_ENGAGEMENT,
      topics: config.topics ?? this.DEFAULT_TOPICS
    };

    this.influencers.set(influencer.handle, influencer);

    if (config.autoFollow) {
      try {
        await this.manager.client.twitterClient.follow(influencer.handle);
        console.log(`Following ${influencer.handle}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to follow ${influencer.handle}: ${errorMessage}`);
      }
    }
  }

  private async processFeeds(runtime: IAgentRuntime) {
    if (!this.manager) return null;

    const signals: OpportunitySource[] = [];

    try {
      // Process influencer feeds
      for (const [handle, influencer] of this.influencers) {
        try {
          // Search for tweets from this user
          const response = await this.manager.client.twitterClient.fetchSearchTweets(
            `from:${handle}`,
            100,
            'Latest'
          );

          const tweets = response?.tweets || [];
          console.log(`Found ${tweets.length} tweets from ${handle}`);

          // Debug: Print tweet structure
          if (tweets.length > 0) {
            console.log('Example tweet structure:', JSON.stringify(tweets[0], null, 2));
          }

          for (const tweet of tweets) {
            const isTopicRelevant = this.isRelevant(tweet, influencer);
            const hasEnoughEngagement = this.hasMinEngagement(tweet, influencer.minEngagement);

            console.log(`Tweet: "${tweet.text?.substring(0, 50)}..."
              Topics match: ${isTopicRelevant}
              Engagement sufficient: ${hasEnoughEngagement}
              Required topics: ${influencer.topics.join(', ')}
              Min engagement: ${influencer.minEngagement}
              Actual engagement: ${(tweet.metrics?.likes || 0) + (tweet.metrics?.retweets || 0) + (tweet.metrics?.replies || 0)}
            `);

            if (isTopicRelevant && hasEnoughEngagement) {
              signals.push(this.convertToOpportunitySource(tweet, influencer));
            }
          }
        } catch (error) {
          console.error(`Error processing feed for ${handle}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing feeds:', error);
    }

    return signals;
  }

  private isRelevant(tweet: any, influencer: Influencer): boolean {
    const text = tweet.text.toLowerCase();
    const hashtags = (tweet.hashtags || []).map((tag: any) => tag.text || tag).map((tag: string) => tag.toLowerCase());

    return influencer.topics.some(topic => {
      const topicLower = topic.toLowerCase();
      // Check in text
      if (text.includes(topicLower)) return true;
      // Check in hashtags
      if (hashtags.includes(topicLower)) return true;
      // Special cases
      if (topicLower === 'token' && (text.includes('coin') || text.includes('alt'))) return true;
      if (topicLower === 'launch' && text.includes('drop')) return true;
      return false;
    });
  }

  private hasMinEngagement(tweet: any, minEngagement: number): boolean {
    const engagement = (tweet.likes || 0) +
                      (tweet.retweets || 0) +
                      (tweet.replies || 0);
    return engagement >= minEngagement;
  }

  private convertToOpportunitySource(tweet: any, influencer: Influencer): OpportunitySource {
    const engagement = (tweet.likes || 0) +
                      (tweet.retweets || 0) +
                      (tweet.replies || 0);

    return {
      type: 'TWITTER',
      timestamp: tweet.timestamp * 1000, // Convert to milliseconds
      confidence: Math.min(engagement / 1000, 1) * influencer.weight,
      data: {
        url: tweet.permanentUrl,
        text: tweet.text,
        metrics: {
          engagement,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies
        }
      }
    };
  }
}