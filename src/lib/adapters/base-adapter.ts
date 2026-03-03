// ============================================
// Core Quadrant Engine — Base Source Adapter
// Abstract base class for all data source adapters
// ============================================

import type { SourceAdapter, SourceAdapterConfig, RawSignal, NormalizedSignal } from "@/lib/engine/types";

/**
 * Abstract base class for source adapters.
 * Provides common functionality like rate limiting, retry logic,
 * and health check patterns. Concrete adapters extend this class.
 */
export abstract class BaseAdapter implements SourceAdapter {
  readonly config: SourceAdapterConfig;

  constructor(config: SourceAdapterConfig) {
    this.config = config;
  }

  abstract fetch(): Promise<RawSignal[]>;
  abstract normalize(raw: RawSignal[]): Promise<NormalizedSignal[]>;

  /**
   * Default health check — tries to fetch with a small limit.
   * Override in subclasses for adapter-specific health checks.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetch();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retry helper with exponential backoff.
   * Used internally by adapters for unreliable external APIs.
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Rate limit helper — ensures we don't exceed the configured rate.
   */
  protected async rateLimit(): Promise<void> {
    const { requests, perSeconds } = this.config.rateLimits;
    if (requests > 0 && perSeconds > 0) {
      const delayMs = (perSeconds / requests) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
