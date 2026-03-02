// ============================================
// Reddit Adapter — Fetches posts/comments from Reddit for PainGaps scans
// Uses Reddit's public JSON API (no OAuth required for public subreddits)
// For authenticated access, set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET env vars
// ============================================

import { BaseAdapter } from "@/lib/adapters/base-adapter";
import type { RawSignal, NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";

const REDDIT_USER_AGENT = "StackQuadrant/1.0 (PainGaps Scanner)";

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

interface RedditComment {
  data: {
    id: string;
    body: string;
    permalink: string;
    author: string;
    subreddit: string;
    created_utc: number;
    score: number;
    parent_id: string;
    link_id: string;
  };
}

interface RedditListing {
  data: {
    children: Array<{ kind: string; data: RedditPost["data"] | RedditComment["data"] }>;
    after: string | null;
  };
}

export interface RedditAdapterOptions {
  keywords: string[];
  subreddits?: string[];
  timeframeDays: number;
  maxResults?: number;
}

export class RedditAdapter extends BaseAdapter {
  private options: RedditAdapterOptions;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: SourceAdapterConfig, options: RedditAdapterOptions) {
    super(config);
    this.options = options;
  }

  /**
   * Get an OAuth token if credentials are configured, for higher rate limits.
   */
  private async getAccessToken(): Promise<string | null> {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) return null;

    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": REDDIT_USER_AGENT,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      console.warn("[reddit-adapter] OAuth token request failed:", response.status);
      return null;
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  private async redditFetch(url: string): Promise<unknown> {
    await this.rateLimit();

    const token = await this.getAccessToken();
    const baseUrl = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
    const fullUrl = `${baseUrl}${url}`;

    const headers: Record<string, string> = {
      "User-Agent": REDDIT_USER_AGENT,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return this.withRetry(async () => {
      const response = await fetch(fullUrl, { headers });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        throw new Error("Rate limited by Reddit");
      }

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    });
  }

  /**
   * Fetch raw signals from Reddit matching the scan's keywords and subreddits.
   */
  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];
    const maxResults = this.options.maxResults || 100;
    const cutoffDate = new Date(Date.now() - this.options.timeframeDays * 24 * 60 * 60 * 1000);

    // Search across specified subreddits or all of Reddit
    const subreddits = this.options.subreddits?.length
      ? this.options.subreddits
      : [""]; // empty string = search all

    for (const subreddit of subreddits) {
      if (signals.length >= maxResults) break;

      for (const keyword of this.options.keywords) {
        if (signals.length >= maxResults) break;

        const subredditPath = subreddit ? `/r/${subreddit}` : "";
        const searchUrl = `${subredditPath}/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&t=${this.getTimeFilter()}&limit=25&restrict_sr=${subreddit ? "on" : "off"}`;

        try {
          const listing = await this.redditFetch(searchUrl) as RedditListing;

          for (const child of listing.data.children) {
            if (signals.length >= maxResults) break;

            const post = child.data as RedditPost["data"];
            const postDate = new Date(post.created_utc * 1000);

            if (postDate < cutoffDate) continue;

            // Include posts with meaningful text content
            if (post.selftext && post.selftext.length > 20) {
              signals.push({
                sourceId: `reddit:post:${post.id}`,
                sourceType: "reddit",
                content: `${post.title}\n\n${post.selftext}`,
                url: `https://www.reddit.com${post.permalink}`,
                author: post.author,
                timestamp: postDate,
                metadata: {
                  subreddit: post.subreddit,
                  score: post.score,
                  numComments: post.num_comments,
                  flair: post.link_flair_text,
                  type: "post",
                  keyword,
                },
              });
            }

            // Fetch top comments for posts with high engagement
            if (post.num_comments >= 5) {
              try {
                const commentsData = await this.redditFetch(
                  `${post.permalink}.json?sort=top&limit=10`
                ) as RedditListing[];

                if (Array.isArray(commentsData) && commentsData[1]?.data?.children) {
                  for (const commentChild of commentsData[1].data.children) {
                    if (signals.length >= maxResults) break;
                    if (commentChild.kind !== "t1") continue;

                    const comment = commentChild.data as RedditComment["data"];
                    if (!comment.body || comment.body.length < 30) continue;

                    const commentDate = new Date(comment.created_utc * 1000);
                    if (commentDate < cutoffDate) continue;

                    signals.push({
                      sourceId: `reddit:comment:${comment.id}`,
                      sourceType: "reddit",
                      content: comment.body,
                      url: `https://www.reddit.com${comment.permalink}`,
                      author: comment.author,
                      timestamp: commentDate,
                      metadata: {
                        subreddit: comment.subreddit,
                        score: comment.score,
                        parentPostId: comment.link_id,
                        type: "comment",
                        keyword,
                      },
                    });
                  }
                }
              } catch (err) {
                console.warn(`[reddit-adapter] Failed to fetch comments for ${post.id}:`, err);
              }
            }
          }
        } catch (err) {
          console.warn(`[reddit-adapter] Search failed for keyword "${keyword}" in r/${subreddit || "all"}:`, err);
        }
      }
    }

    return signals;
  }

  /**
   * Normalize Reddit signals — dedup and add pain-gap-relevant metadata.
   */
  async normalize(raw: RawSignal[]): Promise<NormalizedSignal[]> {
    const seen = new Set<string>();
    const normalized: NormalizedSignal[] = [];

    for (const signal of raw) {
      if (seen.has(signal.sourceId)) continue;
      seen.add(signal.sourceId);

      normalized.push({
        sourceId: signal.sourceId,
        sourceType: signal.sourceType,
        content: signal.content.slice(0, 5000), // Cap content length
        url: signal.url,
        author: signal.author,
        timestamp: signal.timestamp,
        metadata: {
          ...signal.metadata,
          sentimentHints: extractSentimentHints(signal.content),
        },
      });
    }

    return normalized;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redditFetch("/r/all/hot.json?limit=1");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Map timeframe days to Reddit's time filter parameter.
   */
  private getTimeFilter(): string {
    if (this.options.timeframeDays <= 7) return "week";
    if (this.options.timeframeDays <= 30) return "month";
    return "year";
  }
}

/**
 * Extract sentiment-related keywords from text (lightweight pre-classification).
 */
function extractSentimentHints(text: string): string[] {
  const lower = text.toLowerCase();
  const hints: string[] = [];

  const painSignals = [
    "frustrated", "annoying", "broken", "bug", "hate", "terrible",
    "worst", "can't", "doesn't work", "fails", "crash", "slow",
    "expensive", "overpriced", "waste", "painful", "nightmare",
    "wish", "need", "want", "looking for", "alternative", "switch",
    "complain", "issue", "problem", "struggle", "difficulty",
  ];

  for (const signal of painSignals) {
    if (lower.includes(signal)) {
      hints.push(signal);
    }
  }

  return hints;
}
