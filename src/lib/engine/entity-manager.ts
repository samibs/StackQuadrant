// ============================================
// Core Quadrant Engine — Entity Manager
// CRUD operations for scored entities across domains
// ============================================

import { db } from "@/lib/db";
import { scoredEntities, dimensionScores, engineScoreHistory } from "@/lib/db/schema";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";
import type { QuadrantEntity } from "./types";

export interface CreateEntityInput {
  domainId: string;
  entityType: string;
  name: string;
  slug: string;
  metadata?: Record<string, unknown>;
}

export interface ListEntitiesOptions {
  domainId: string;
  entityType?: string;
  search?: string;
  sortBy?: "name" | "compositeScore" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}

/**
 * Create a new scored entity in a domain.
 */
export async function createEntity(input: CreateEntityInput): Promise<string> {
  const [entity] = await db.insert(scoredEntities).values({
    domainId: input.domainId,
    entityType: input.entityType,
    name: input.name,
    slug: input.slug,
    metadata: input.metadata ?? {},
  }).returning({ id: scoredEntities.id });

  return entity.id;
}

/**
 * Get an entity by ID with full details.
 */
export async function getEntity(entityId: string) {
  const result = await db.select()
    .from(scoredEntities)
    .where(eq(scoredEntities.id, entityId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get an entity by domain + slug.
 */
export async function getEntityBySlug(domainId: string, slug: string) {
  const result = await db.select()
    .from(scoredEntities)
    .where(and(
      eq(scoredEntities.domainId, domainId),
      eq(scoredEntities.slug, slug),
    ))
    .limit(1);

  return result[0] ?? null;
}

/**
 * List entities with filtering, search, and pagination.
 */
export async function listEntities(options: ListEntitiesOptions) {
  const conditions = [eq(scoredEntities.domainId, options.domainId)];

  if (options.entityType) {
    conditions.push(eq(scoredEntities.entityType, options.entityType));
  }

  if (options.activeOnly !== false) {
    conditions.push(eq(scoredEntities.isActive, true));
  }

  if (options.search) {
    conditions.push(ilike(scoredEntities.name, `%${options.search}%`));
  }

  const sortCol = (() => {
    switch (options.sortBy) {
      case "compositeScore": return scoredEntities.compositeScore;
      case "createdAt": return scoredEntities.createdAt;
      case "updatedAt": return scoredEntities.updatedAt;
      default: return scoredEntities.name;
    }
  })();

  const orderFn = options.sortOrder === "asc" ? asc : desc;

  const entities = await db.select()
    .from(scoredEntities)
    .where(and(...conditions))
    .orderBy(orderFn(sortCol))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  // Get total count for pagination
  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scoredEntities)
    .where(and(...conditions));

  return {
    entities,
    total: total?.count ?? 0,
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
  };
}

/**
 * Update entity metadata and/or basic fields.
 */
export async function updateEntity(
  entityId: string,
  updates: {
    name?: string;
    slug?: string;
    metadata?: Record<string, unknown>;
    isActive?: boolean;
  }
): Promise<void> {
  await db.update(scoredEntities).set({
    ...updates,
    updatedAt: new Date(),
  }).where(eq(scoredEntities.id, entityId));
}

/**
 * Delete an entity and all its scores/history (cascade).
 */
export async function deleteEntity(entityId: string): Promise<void> {
  await db.delete(scoredEntities).where(eq(scoredEntities.id, entityId));
}

/**
 * Get entities formatted for quadrant visualization.
 */
export async function getQuadrantEntities(
  domainId: string,
  entityType?: string
): Promise<QuadrantEntity[]> {
  const conditions = [
    eq(scoredEntities.domainId, domainId),
    eq(scoredEntities.isActive, true),
  ];

  if (entityType) {
    conditions.push(eq(scoredEntities.entityType, entityType));
  }

  const entities = await db.select()
    .from(scoredEntities)
    .where(and(...conditions));

  return entities
    .filter((e) => e.quadrantX !== null && e.quadrantY !== null)
    .map((e) => ({
      id: e.id,
      label: e.name,
      x: Number(e.quadrantX),
      y: Number(e.quadrantY),
      colorValue: e.compositeScore ? Number(e.compositeScore) : undefined,
      sizeValue: undefined,
      metadata: e.metadata as Record<string, unknown>,
    }));
}

/**
 * Get entity count by type for a domain.
 */
export async function getEntityCountsByType(domainId: string) {
  const result = await db
    .select({
      entityType: scoredEntities.entityType,
      count: sql<number>`count(*)::int`,
    })
    .from(scoredEntities)
    .where(and(
      eq(scoredEntities.domainId, domainId),
      eq(scoredEntities.isActive, true),
    ))
    .groupBy(scoredEntities.entityType);

  return result;
}
