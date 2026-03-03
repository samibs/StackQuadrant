// ============================================
// Reddit FinServ Adapter — Financial services subreddits
// Extends the base Reddit adapter for finserv-specific subreddits
// ============================================

import { BaseAdapter } from "@/lib/adapters/base-adapter";
import type { RawSignal, NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";

const REDDIT_USER_AGENT = "StackQuadrant/1.0 (FinServ Intelligence)";

const FINSERV_SUBREDDITS = [
  "accounting", "banking", "CFP", "tax", "financialcareers",
  "fintech", "compliance", "InternalAudit", "FinancialPlanning",
  "WealthManagement", "CFA", "finance",
];

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    author: string;
    subreddit: string;
    created_utc: number;
    score: number;
    num_comments: number;
    link_flair_text?: string;
  };
}

export class RedditFinservAdapter extends BaseAdapter {
  private subreddits: string[];
  private keywords: string[];

  constructor(config: SourceAdapterConfig, keywords: string[] = [], subreddits?: string[]) {
    super(config);
    this.subreddits = subreddits || FINSERV_SUBREDDITS;
    this.keywords = keywords;
  }

  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const subreddit of this.subreddits) {
      try {
        await this.rateLimit();

        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`;
        const response = await this.withRetry(async () => {
          const res = await fetch(url, {
            headers: { "User-Agent": REDDIT_USER_AGENT },
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);
          return res;
        });

        const data = await response.json();
        const posts: RedditPost[] = data?.data?.children || [];

        for (const post of posts) {
          const content = `${post.data.title}\n\n${post.data.selftext || ""}`.trim();
          if (!content || content.length < 20) continue;

          // If keywords specified, filter for relevance
          if (this.keywords.length > 0) {
            const lowerContent = content.toLowerCase();
            const hasKeyword = this.keywords.some((k) => lowerContent.includes(k.toLowerCase()));
            if (!hasKeyword) continue;
          }

          signals.push({
            sourceId: `reddit-finserv-${post.data.id}`,
            sourceType: "reddit-finserv",
            content: content.slice(0, 5000),
            url: `https://reddit.com${post.data.permalink}`,
            author: post.data.author,
            timestamp: new Date(post.data.created_utc * 1000),
            metadata: {
              subreddit: post.data.subreddit,
              score: post.data.score,
              numComments: post.data.num_comments,
              flair: post.data.link_flair_text,
              sector: this.inferSector(post.data.subreddit),
            },
          });
        }
      } catch (error) {
        console.error(`Failed to fetch r/${subreddit}:`, error);
      }
    }

    return signals;
  }

  async normalize(raw: RawSignal[]): Promise<NormalizedSignal[]> {
    const seen = new Set<string>();
    return raw.filter((signal) => {
      if (seen.has(signal.sourceId)) return false;
      seen.add(signal.sourceId);
      return true;
    });
  }

  private inferSector(subreddit: string): string {
    const sectorMap: Record<string, string> = {
      accounting: "accounting",
      tax: "accounting",
      banking: "banking",
      fintech: "banking",
      CFP: "wealth",
      FinancialPlanning: "wealth",
      WealthManagement: "wealth",
      CFA: "fund",
      InternalAudit: "audit",
      compliance: "fund",
      finance: "fund",
      financialcareers: "fund",
    };
    return sectorMap[subreddit] || "fund";
  }
}
