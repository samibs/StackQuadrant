// ============================================
// Source Adapter Registry
// All adapters are registered and exported from here
// ============================================

export { BaseAdapter } from "./base-adapter";

// Adapter registry — add new adapters here as they are implemented
// import { GitHubAdapter } from "./github-adapter";
// import { RedditAdapter } from "./reddit-adapter";

import type { SourceAdapter } from "@/lib/engine/types";

/**
 * Get all registered adapters for a given domain.
 * Returns only enabled adapters.
 */
export function getAdaptersForDomain(domainId: string): SourceAdapter[] {
  // Adapters will be registered here as they are implemented
  // For now, return empty array — adapters are additive
  return [];
}
