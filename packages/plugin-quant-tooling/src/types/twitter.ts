export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  url: string;
  author_username?: string;
  hashtags?: string[];
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
    quotes?: number;
    engagement?: number;
  };
}

export interface TwitterCredentials {
  username: string;
  password: string;
  email: string;
}

export interface TwitterClient {
  interaction: {
    follow(handle: string): Promise<void>;
    unfollow(handle: string): Promise<void>;
    like?(postId: string): Promise<boolean>;
    repost?(postId: string): Promise<boolean>;
  };
  search: {
    searchTweets(query: string): Promise<Tweet[]>;
    getPostsByUser?(username: string, limit?: number): Promise<Tweet[]>;
  };
}

export interface TwitterConfig {
  credentials: TwitterCredentials;
  pollInterval?: number;
  trackedInfluencers?: string[];
}