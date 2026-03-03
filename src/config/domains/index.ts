// ============================================
// Domain Configuration Registry
// All domain configs are exported from here
// ============================================

import { developerToolsDomain } from "./developer-tools";
import type { DomainConfig } from "@/lib/engine/types";

/**
 * All registered domain configurations.
 * Add new verticals here as they are implemented.
 */
export const domainConfigs: DomainConfig[] = [
  developerToolsDomain,
];

/**
 * Lookup a domain config by ID.
 */
export function getDomainConfig(id: string): DomainConfig | undefined {
  return domainConfigs.find((d) => d.id === id);
}

/**
 * Lookup a domain config by slug.
 */
export function getDomainConfigBySlug(slug: string): DomainConfig | undefined {
  return domainConfigs.find((d) => d.slug === slug);
}
