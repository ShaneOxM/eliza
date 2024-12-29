export interface Influencer {
  handle: string;
  weight: number;
  minEngagement: number;
  topics: string[];
}

export interface OpportunitySource {
  type: string;
  timestamp: number;
  confidence: number;
  data: {
    url: string;
    text: string;
    metrics: {
      engagement: number;
      likes?: number;
      retweets?: number;
      replies?: number;
    };
  };
}

export interface Opportunity {
  id: string;
  symbol: string;
  chain: string;
  timestamp: number;
  sources: OpportunitySource[];
  score: {
    social: number;     // 0-100
    technical: number;  // 0-100
    overall: number;    // 0-100
  };
  analysis: {
    summary: string;
    signals: Array<{
      type: string;
      strength: number;
      reason: string;
    }>;
    risks: string[];
  };
  status: 'NEW' | 'TRACKING' | 'EXPIRED';
  lastUpdated: number;
}