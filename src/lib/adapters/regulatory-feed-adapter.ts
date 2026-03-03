// ============================================
// Regulatory Feed Adapter — Ingests regulatory publications from RSS feeds
// Supports: CSSF, FCA, SEC, FINMA, ESMA, EBA, EIOPA, OECD, FATF
// ============================================

import { BaseAdapter } from "@/lib/adapters/base-adapter";
import type { RawSignal, NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";

// Regulatory body RSS/Atom feed URLs
const REGULATORY_FEEDS: Record<string, { name: string; url: string; jurisdiction: string }> = {
  cssf: {
    name: "CSSF",
    url: "https://www.cssf.lu/en/feed/",
    jurisdiction: "LU",
  },
  fca: {
    name: "FCA",
    url: "https://www.fca.org.uk/news/rss.xml",
    jurisdiction: "UK",
  },
  sec: {
    name: "SEC",
    url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=&dateb=&owner=include&count=40&search_text=&action=getcompany&RSS",
    jurisdiction: "US",
  },
  esma: {
    name: "ESMA",
    url: "https://www.esma.europa.eu/press-news/esma-news/feed",
    jurisdiction: "EU",
  },
  eba: {
    name: "EBA",
    url: "https://www.eba.europa.eu/rss",
    jurisdiction: "EU",
  },
};

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string;
}

export class RegulatoryFeedAdapter extends BaseAdapter {
  private feedIds: string[];

  constructor(config: SourceAdapterConfig, feedIds?: string[]) {
    super(config);
    this.feedIds = feedIds || Object.keys(REGULATORY_FEEDS);
  }

  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const feedId of this.feedIds) {
      const feed = REGULATORY_FEEDS[feedId];
      if (!feed) continue;

      try {
        await this.rateLimit();
        const items = await this.fetchFeed(feed.url);

        for (const item of items) {
          signals.push({
            sourceId: `reg-${feedId}-${Buffer.from(item.link).toString("base64url").slice(0, 32)}`,
            sourceType: "regulatory-feed",
            content: `${item.title}\n\n${item.description || ""}`,
            url: item.link,
            author: feed.name,
            timestamp: new Date(item.pubDate || Date.now()),
            metadata: {
              feedId,
              regulatoryBody: feed.name,
              jurisdiction: feed.jurisdiction,
              category: item.category,
            },
          });
        }
      } catch (error) {
        console.error(`Failed to fetch regulatory feed ${feedId}:`, error);
      }
    }

    return signals;
  }

  async normalize(raw: RawSignal[]): Promise<NormalizedSignal[]> {
    const seen = new Set<string>();
    const normalized: NormalizedSignal[] = [];

    for (const signal of raw) {
      if (seen.has(signal.sourceId)) continue;
      seen.add(signal.sourceId);

      // Clean up HTML from RSS descriptions
      const cleanContent = signal.content
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);

      normalized.push({
        ...signal,
        content: cleanContent,
      });
    }

    return normalized;
  }

  private async fetchFeed(url: string): Promise<FeedItem[]> {
    const response = await this.withRetry(async () => {
      const res = await fetch(url, {
        headers: { "User-Agent": "StackQuadrant/1.0 (Regulatory Monitor)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
      return res;
    });

    const text = await response.text();
    return this.parseRSSorAtom(text);
  }

  private parseRSSorAtom(xml: string): FeedItem[] {
    const items: FeedItem[] = [];

    // Simple RSS <item> extraction
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = this.extractTag(itemXml, "title");
      const link = this.extractTag(itemXml, "link") || this.extractTag(itemXml, "guid");
      const description = this.extractTag(itemXml, "description") || this.extractTag(itemXml, "summary");
      const pubDate = this.extractTag(itemXml, "pubDate") || this.extractTag(itemXml, "published") || this.extractTag(itemXml, "updated");
      const category = this.extractTag(itemXml, "category");

      if (title && link) {
        items.push({ title, link, description: description || "", pubDate: pubDate || new Date().toISOString(), category: category || undefined });
      }
    }

    // Fallback: Atom <entry> extraction
    if (items.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entryXml = match[1];
        const title = this.extractTag(entryXml, "title");
        const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["']/);
        const link = linkMatch ? linkMatch[1] : this.extractTag(entryXml, "link");
        const description = this.extractTag(entryXml, "summary") || this.extractTag(entryXml, "content");
        const pubDate = this.extractTag(entryXml, "published") || this.extractTag(entryXml, "updated");

        if (title && link) {
          items.push({ title, link, description: description || "", pubDate: pubDate || new Date().toISOString() });
        }
      }
    }

    return items;
  }

  private extractTag(xml: string, tag: string): string {
    // Handle CDATA: <tag><![CDATA[content]]></tag>
    const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    // Normal: <tag>content</tag>
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  }
}
