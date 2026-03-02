// ============================================
// Review Site Adapter — Fetches negative reviews from Trustpilot, G2, Capterra
// Captures 1-2 star reviews for products in target markets
// Uses public review pages (no API key required for basic extraction)
// ============================================

import { BaseAdapter } from "@/lib/adapters/base-adapter";
import type { RawSignal, NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";

interface ReviewSite {
  name: string;
  searchUrl: (keyword: string) => string;
  parseReviews: (html: string, keyword: string) => ParsedReview[];
}

interface ParsedReview {
  id: string;
  title: string;
  content: string;
  rating: number;
  author: string;
  date: string;
  url: string;
  productName: string;
}

export class ReviewSiteAdapter extends BaseAdapter {
  private keywords: string[];
  private sites: ReviewSite[];

  constructor(config: SourceAdapterConfig, keywords: string[]) {
    super(config);
    this.keywords = keywords;
    this.sites = [
      {
        name: "G2",
        searchUrl: (keyword: string) => `https://www.g2.com/search?utf8=%E2%9C%93&query=${encodeURIComponent(keyword)}`,
        parseReviews: this.parseG2Reviews.bind(this),
      },
      {
        name: "Capterra",
        searchUrl: (keyword: string) => `https://www.capterra.com/search/?query=${encodeURIComponent(keyword)}`,
        parseReviews: this.parseCapterraReviews.bind(this),
      },
    ];
  }

  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const keyword of this.keywords) {
      for (const site of this.sites) {
        try {
          await this.rateLimit();

          const url = site.searchUrl(keyword);
          const response = await this.withRetry(async () => {
            const res = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; StackQuadrant/1.0; Research Bot)",
                Accept: "text/html,application/xhtml+xml",
              },
              signal: AbortSignal.timeout(15000),
            });
            if (!res.ok) throw new Error(`${site.name} fetch failed: ${res.status}`);
            return res;
          });

          const html = await response.text();
          const reviews = site.parseReviews(html, keyword);

          for (const review of reviews) {
            if (review.rating > 2) continue; // Only 1-2 star reviews

            signals.push({
              sourceId: `review-${site.name.toLowerCase()}-${review.id}`,
              sourceType: "review-site",
              content: `${review.title}\n\n${review.content}`,
              url: review.url,
              author: review.author,
              timestamp: new Date(review.date || Date.now()),
              metadata: {
                site: site.name,
                rating: review.rating,
                productName: review.productName,
                keyword,
              },
            });
          }
        } catch (error) {
          console.error(`Review site fetch error (${site.name}, "${keyword}"):`, error);
        }
      }
    }

    return signals;
  }

  async normalize(raw: RawSignal[]): Promise<NormalizedSignal[]> {
    const seen = new Set<string>();
    return raw.filter((signal) => {
      if (seen.has(signal.sourceId)) return false;
      seen.add(signal.sourceId);
      return signal.content.length >= 30;
    });
  }

  private parseG2Reviews(html: string, keyword: string): ParsedReview[] {
    const reviews: ParsedReview[] = [];

    // Extract review blocks from G2 HTML
    const reviewRegex = /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    let match;
    let idx = 0;

    while ((match = reviewRegex.exec(html)) !== null && idx < 20) {
      const block = match[1];
      const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/i);
      const contentMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
      const ratingMatch = block.match(/(\d(?:\.\d)?)\s*(?:out of|\/)\s*5/i);

      if (titleMatch && contentMatch) {
        const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
        const content = contentMatch[1].replace(/<[^>]+>/g, "").trim();
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 3;

        reviews.push({
          id: `g2-${keyword}-${idx}`,
          title,
          content,
          rating,
          author: "G2 User",
          date: new Date().toISOString(),
          url: `https://www.g2.com/search?query=${encodeURIComponent(keyword)}`,
          productName: keyword,
        });
        idx++;
      }
    }

    return reviews;
  }

  private parseCapterraReviews(html: string, keyword: string): ParsedReview[] {
    const reviews: ParsedReview[] = [];

    // Extract review data from Capterra HTML structure
    const reviewRegex = /<div[^>]*class="[^"]*review-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    let match;
    let idx = 0;

    while ((match = reviewRegex.exec(html)) !== null && idx < 20) {
      const block = match[1];
      const titleMatch = block.match(/<h\d[^>]*>(.*?)<\/h\d>/i);
      const contentMatch = block.match(/<p[^>]*>(.*?)<\/p>/i);
      const ratingMatch = block.match(/(\d(?:\.\d)?)\s*(?:out of|\/)\s*5/i);

      if (titleMatch || contentMatch) {
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const content = contentMatch ? contentMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 3;

        reviews.push({
          id: `capterra-${keyword}-${idx}`,
          title: title || "Review",
          content,
          rating,
          author: "Capterra User",
          date: new Date().toISOString(),
          url: `https://www.capterra.com/search/?query=${encodeURIComponent(keyword)}`,
          productName: keyword,
        });
        idx++;
      }
    }

    return reviews;
  }
}
