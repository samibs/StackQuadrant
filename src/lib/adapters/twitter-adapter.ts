// ============================================
// Twitter/X Adapter — Fetches complaint patterns from Twitter API v2
// Captures rant threads, "I wish..." signals, complaint patterns
// Requires TWITTER_BEARER_TOKEN env var
// ============================================

import { BaseAdapter } from "@/lib/adapters/base-adapter";
import type { RawSignal, NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";

const PAIN_QUERIES = [
  '("I hate" OR "I wish" OR "so frustrating" OR "worst thing about" OR "can\'t believe")',
];

export class TwitterAdapter extends BaseAdapter {
  private keywords: string[];

  constructor(config: SourceAdapterConfig, keywords: string[]) {
    super(config);
    this.keywords = keywords;
  }

  private getBearerToken(): string {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token) throw new Error("TWITTER_BEARER_TOKEN environment variable is required");
    return token;
  }

  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const keyword of this.keywords) {
      try {
        await this.rateLimit();

        // Build search query: keyword + pain patterns
        const query = `${keyword} ${PAIN_QUERIES[0]} -is:retweet lang:en`;
        const tweets = await this.searchTweets(query);

        for (const tweet of tweets) {
          signals.push({
            sourceId: `twitter-${tweet.id}`,
            sourceType: "twitter",
            content: tweet.text,
            url: `https://twitter.com/i/status/${tweet.id}`,
            author: tweet.author_id,
            timestamp: new Date(tweet.created_at),
            metadata: {
              keyword,
              metrics: tweet.public_metrics,
              lang: tweet.lang,
            },
          });
        }
      } catch (error) {
        console.error(`Twitter fetch error for "${keyword}":`, error);
      }
    }

    return signals;
  }

  async normalize(raw: RawSignal[]): Promise<NormalizedSignal[]> {
    const seen = new Set<string>();
    return raw.filter((signal) => {
      if (seen.has(signal.sourceId)) return false;
      seen.add(signal.sourceId);
      return signal.content.length >= 30; // Filter out very short tweets
    });
  }

  private async searchTweets(query: string): Promise<Array<{
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    lang: string;
    public_metrics: { like_count: number; retweet_count: number; reply_count: number };
  }>> {
    const bearerToken = this.getBearerToken();
    const url = new URL("https://api.twitter.com/2/tweets/search/recent");
    url.searchParams.set("query", query);
    url.searchParams.set("max_results", "50");
    url.searchParams.set("tweet.fields", "created_at,author_id,lang,public_metrics");

    const response = await this.withRetry(async () => {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "User-Agent": "StackQuadrant/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        throw new Error(`Twitter rate limited. Retry after ${retryAfter}s`);
      }
      if (!res.ok) throw new Error(`Twitter API error: ${res.status}`);
      return res;
    });

    const data = await response.json();
    return data.data || [];
  }
}
