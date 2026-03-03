// ============================================
// Core Quadrant Engine — Domain Registry
// Central registry for managing domain verticals
// ============================================

import { db } from "@/lib/db";
import { domains, scoringDimensions, scoredEntities } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import type { DomainConfig, DomainSummary } from "./types";

/**
 * Register a new domain vertical with the engine.
 * Creates the domain record and its scoring dimensions.
 */
export async function registerDomain(config: DomainConfig): Promise<void> {
  const existing = await db.select().from(domains).where(eq(domains.id, config.id)).limit(1);

  if (existing.length > 0) {
    // Update existing domain config
    await db.update(domains).set({
      name: config.name,
      slug: config.slug,
      description: config.description,
      config: config,
      updatedAt: new Date(),
    }).where(eq(domains.id, config.id));
  } else {
    // Insert new domain
    await db.insert(domains).values({
      id: config.id,
      name: config.name,
      slug: config.slug,
      description: config.description,
      config: config,
      isActive: true,
    });
  }

  // Upsert scoring dimensions for this domain
  for (const dim of config.scoringDimensions) {
    const existingDim = await db.select()
      .from(scoringDimensions)
      .where(and(
        eq(scoringDimensions.domainId, config.id),
        eq(scoringDimensions.name, dim.name),
      ))
      .limit(1);

    if (existingDim.length > 0) {
      await db.update(scoringDimensions).set({
        description: dim.description,
        weight: String(dim.weight),
        scaleMin: dim.scale.min,
        scaleMax: dim.scale.max,
        displayOrder: dim.displayOrder,
      }).where(eq(scoringDimensions.id, existingDim[0].id));
    } else {
      await db.insert(scoringDimensions).values({
        domainId: config.id,
        name: dim.name,
        description: dim.description,
        weight: String(dim.weight),
        scaleMin: dim.scale.min,
        scaleMax: dim.scale.max,
        displayOrder: dim.displayOrder,
      });
    }
  }
}

/**
 * Get a domain by its ID, including its full configuration.
 */
export async function getDomain(domainId: string) {
  const result = await db.select().from(domains).where(eq(domains.id, domainId)).limit(1);
  return result[0] ?? null;
}

/**
 * Get a domain by its URL slug.
 */
export async function getDomainBySlug(slug: string) {
  const result = await db.select().from(domains).where(eq(domains.slug, slug)).limit(1);
  return result[0] ?? null;
}

/**
 * List all active domains with entity counts.
 */
export async function listDomains(): Promise<DomainSummary[]> {
  const allDomains = await db.select().from(domains).where(eq(domains.isActive, true));

  const summaries: DomainSummary[] = [];
  for (const domain of allDomains) {
    const [entityCount] = await db
      .select({ count: count() })
      .from(scoredEntities)
      .where(and(
        eq(scoredEntities.domainId, domain.id),
        eq(scoredEntities.isActive, true),
      ));

    summaries.push({
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description,
      entityCount: entityCount?.count ?? 0,
      isActive: domain.isActive,
    });
  }

  return summaries;
}

/**
 * Get the scoring dimensions for a domain, ordered by display order.
 */
export async function getDomainDimensions(domainId: string) {
  return db.select()
    .from(scoringDimensions)
    .where(eq(scoringDimensions.domainId, domainId))
    .orderBy(scoringDimensions.displayOrder);
}

/**
 * Activate or deactivate a domain.
 */
export async function setDomainActive(domainId: string, isActive: boolean): Promise<void> {
  await db.update(domains).set({
    isActive,
    updatedAt: new Date(),
  }).where(eq(domains.id, domainId));
}
