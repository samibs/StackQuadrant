// ============================================
// Google Autocomplete Adapter — Fetches pain-related search suggestions
// Captures "Why can't I...", "How to fix...", "[product] alternative" patterns
// ============================================

import { BaseAdapter } from "@/lib/adapters/base-adapter";
import type { RawSignal, NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";

const PAIN_PREFIXES = [
  "why can't I",
  "how to fix",
  "alternative to",
  "problems with",
  "frustrated with",
  "hate",
  "worst thing about",
  "can't stand",
];

export class GoogleAutocompleteAdapter extends BaseAdapter {
  private keywords: string[];

  constructor(config: SourceAdapterConfig, keywords: string[]) {
    super(config);
    this.keywords = keywords;
  }

  async fetch(): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const keyword of this.keywords) {
      for (const prefix of PAIN_PREFIXES) {
        try {
          await this.rateLimit();
          const query = `${prefix} ${keyword}`;
          const suggestions = await this.fetchSuggestions(query);

          for (const suggestion of suggestions) {
            signals.push({
              sourceId: `google-ac-${Buffer.from(suggestion).toString("base64url").slice(0, 32)}`,
              sourceType: "google-autocomplete",
              content: suggestion,
              url: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
              timestamp: new Date(),
              metadata: {
                keyword,
                prefix,
                suggestionType: this.classifySuggestion(suggestion),
              },
            });
          }
        } catch (error) {
          console.error(`Google Autocomplete fetch error for "${keyword}":`, error);
        }
      }
    }

    return signals;
  }

  async normalize(raw: RawSignal[]): Promise<NormalizedSignal[]> {
    const seen = new Set<string>();
    return raw.filter((signal) => {
      const key = signal.content.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async fetchSuggestions(query: string): Promise<string[]> {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;

    const response = await this.withRetry(async () => {
      const res = await fetch(url, {
        headers: { "User-Agent": "StackQuadrant/1.0 (Pain Signal Research)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Google Suggest API error: ${res.status}`);
      return res;
    });

    const data = await response.json();
    // Response format: ["query", ["suggestion1", "suggestion2", ...]]
    return Array.isArray(data[1]) ? data[1] : [];
  }

  private classifySuggestion(suggestion: string): string {
    const lower = suggestion.toLowerCase();
    if (lower.includes("alternative")) return "seeking_alternative";
    if (lower.includes("fix") || lower.includes("solve")) return "seeking_solution";
    if (lower.includes("hate") || lower.includes("frustrated") || lower.includes("can't stand")) return "frustration";
    if (lower.includes("why can't")) return "capability_gap";
    if (lower.includes("problem") || lower.includes("issue")) return "problem_report";
    return "general_pain";
  }
}
