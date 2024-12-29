import { IAgentRuntime } from '@elizaos/core';
import { TwitterClient, Tweet, TwitterCredentials } from '../types/twitter';

// Rate limiting constants
const RATE_LIMITS = {
  FOLLOW: { MAX: 50, WINDOW: 24 * 60 * 60 * 1000 }, // 50 follows per day
  UNFOLLOW: { MAX: 50, WINDOW: 24 * 60 * 60 * 1000 }, // 50 unfollows per day
  SEARCH: { MAX: 180, WINDOW: 15 * 60 * 1000 }, // 180 requests per 15 minutes
  LIKE: { MAX: 100, WINDOW: 24 * 60 * 60 * 1000 } // 100 likes per day
};

interface RateLimit {
  count: number;
  resetTime: number;
}

export class TwitterService implements TwitterClient {
  private credentials: TwitterCredentials;
  private isAuthenticated = false;
  private rateLimits: Map<string, RateLimit>;
  private lastActionTime: number = 0;
  private readonly MIN_ACTION_DELAY = 2000; // Minimum 2 seconds between actions

  constructor(credentials: TwitterCredentials) {
    this.credentials = credentials;
    this.rateLimits = new Map();
  }

  static async start(runtime: IAgentRuntime): Promise<TwitterClient> {
    const credentials: TwitterCredentials = {
      username: runtime.getSetting('TWITTER_USERNAME') || '',
      password: runtime.getSetting('TWITTER_PASSWORD') || '',
      email: runtime.getSetting('TWITTER_EMAIL') || ''
    };

    const client = new TwitterService(credentials);
    await client.authenticate();
    return client;
  }

  private async authenticate(): Promise<void> {
    // TODO: Implement actual Twitter authentication
    // For now, just simulate authentication
    this.isAuthenticated = true;
  }

  private async checkRateLimit(action: string, limits: { MAX: number; WINDOW: number }): Promise<boolean> {
    const now = Date.now();
    const limit = this.rateLimits.get(action) || { count: 0, resetTime: now + limits.WINDOW };

    // Reset if window has passed
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + limits.WINDOW;
    }

    // Check if we're at the limit
    if (limit.count >= limits.MAX) {
      console.warn(`Rate limit reached for ${action}. Resets at ${new Date(limit.resetTime)}`);
      return false;
    }

    // Enforce minimum delay between actions
    const timeSinceLastAction = now - this.lastActionTime;
    if (timeSinceLastAction < this.MIN_ACTION_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_ACTION_DELAY - timeSinceLastAction));
    }

    // Update counters
    limit.count++;
    this.rateLimits.set(action, limit);
    this.lastActionTime = Date.now();

    return true;
  }

  interaction = {
    follow: async (handle: string): Promise<void> => {
      if (!this.isAuthenticated) throw new Error('Not authenticated');

      if (!await this.checkRateLimit('FOLLOW', RATE_LIMITS.FOLLOW)) {
        throw new Error('Rate limit exceeded for follow action');
      }

      // TODO: Implement actual Twitter follow
      console.log(`Following ${handle}`);
    },

    unfollow: async (handle: string): Promise<void> => {
      if (!this.isAuthenticated) throw new Error('Not authenticated');

      if (!await this.checkRateLimit('UNFOLLOW', RATE_LIMITS.UNFOLLOW)) {
        throw new Error('Rate limit exceeded for unfollow action');
      }

      // TODO: Implement actual Twitter unfollow
      console.log(`Unfollowing ${handle}`);
    },

    like: async (postId: string): Promise<boolean> => {
      if (!this.isAuthenticated) throw new Error('Not authenticated');

      if (!await this.checkRateLimit('LIKE', RATE_LIMITS.LIKE)) {
        throw new Error('Rate limit exceeded for like action');
      }

      // TODO: Implement actual Twitter like
      console.log(`Liking post ${postId}`);
      return true;
    }
  };

  search = {
    searchTweets: async (query: string): Promise<Tweet[]> => {
      if (!this.isAuthenticated) throw new Error('Not authenticated');

      if (!await this.checkRateLimit('SEARCH', RATE_LIMITS.SEARCH)) {
        throw new Error('Rate limit exceeded for search action');
      }

      // TODO: Implement actual Twitter search
      // For now, return mock data
      return [{
        id: '1',
        text: 'Mock tweet for query: ' + query,
        created_at: new Date().toISOString(),
        url: 'https://twitter.com/mock/1',
        author_username: 'mock_user',
        metrics: {
          likes: 10,
          retweets: 5,
          replies: 2,
          quotes: 1,
          engagement: 18
        }
      }];
    },

    getPostsByUser: async (username: string, limit: number = 10): Promise<Tweet[]> => {
      if (!this.isAuthenticated) throw new Error('Not authenticated');

      if (!await this.checkRateLimit('SEARCH', RATE_LIMITS.SEARCH)) {
        throw new Error('Rate limit exceeded for search action');
      }

      // TODO: Implement actual user timeline fetch
      return [{
        id: '2',
        text: `Mock tweet from user: ${username}`,
        created_at: new Date().toISOString(),
        url: `https://twitter.com/${username}/2`,
        author_username: username,
        metrics: {
          likes: 15,
          retweets: 7,
          replies: 3,
          quotes: 2,
          engagement: 27
        }
      }];
    }
  };
}

export default TwitterService;