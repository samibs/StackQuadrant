// ============================================
// Core Quadrant Engine — Scoring Engine
// Configurable weighted composite scoring for any dimension set
// ============================================

import { db } from "@/lib/db";
import {
  scoringDimensions,
  scoredEntities,
  dimensionScores,
  engineScoreHistory,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ScoringInput, ScoringResult } from "./types";
import { getDomainDimensions } from "./domain-registry";

/**
 * Score an entity across all dimensions and compute its composite score.
 * Stores dimension scores and updates the entity's composite + quadrant position.
 */
export async function scoreEntity(
  domainId: string,
  input: ScoringInput,
  source: string = "manual"
): Promise<ScoringResult> {
  const dims = await getDomainDimensions(domainId);
  if (dims.length === 0) {
    throw new Error(`No scoring dimensions found for domain: ${domainId}`);
  }

  // Build dimension lookup by ID
  const dimMap = new Map(dims.map((d) => [d.id, d]));

  // Validate all input dimensions exist
  for (const s of input.scores) {
    if (!dimMap.has(s.dimensionId)) {
      throw new Error(`Unknown dimension ID: ${s.dimensionId} for domain: ${domainId}`);
    }
  }

  // Store/update individual dimension scores
  const detailedScores: ScoringResult["dimensionScores"] = [];

  for (const s of input.scores) {
    const dim = dimMap.get(s.dimensionId)!;
    const clampedScore = Math.max(
      dim.scaleMin,
      Math.min(dim.scaleMax, s.score)
    );

    // Upsert dimension score
    const existing = await db.select()
      .from(dimensionScores)
      .where(and(
        eq(dimensionScores.entityId, input.entityId),
        eq(dimensionScores.dimensionId, s.dimensionId),
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(dimensionScores).set({
        score: String(clampedScore),
        scoredAt: new Date(),
        source,
      }).where(eq(dimensionScores.id, existing[0].id));
    } else {
      await db.insert(dimensionScores).values({
        entityId: input.entityId,
        dimensionId: s.dimensionId,
        score: String(clampedScore),
        source,
      });
    }

    const weight = Number(dim.weight);
    detailedScores.push({
      dimensionId: s.dimensionId,
      score: clampedScore,
      weightedScore: clampedScore * weight,
    });
  }

  // Compute composite score (weighted average)
  const compositeScore = computeComposite(detailedScores, dims);

  // Compute quadrant position from dimension scores
  const entity = await db.select().from(scoredEntities)
    .where(eq(scoredEntities.id, input.entityId))
    .limit(1);

  if (!entity[0]) {
    throw new Error(`Entity not found: ${input.entityId}`);
  }

  const { quadrantX, quadrantY } = await computeQuadrantPosition(
    domainId,
    input.entityId,
    detailedScores,
    dims
  );

  // Update entity with composite score and quadrant position
  await db.update(scoredEntities).set({
    compositeScore: String(compositeScore),
    quadrantX: String(quadrantX),
    quadrantY: String(quadrantY),
    updatedAt: new Date(),
  }).where(eq(scoredEntities.id, input.entityId));

  // Record score history snapshot
  const dimScoreSnapshot: Record<string, number> = {};
  for (const s of detailedScores) {
    dimScoreSnapshot[s.dimensionId] = s.score;
  }

  await db.insert(engineScoreHistory).values({
    entityId: input.entityId,
    compositeScore: String(compositeScore),
    dimensionScores: dimScoreSnapshot,
  });

  return {
    entityId: input.entityId,
    compositeScore,
    quadrantX,
    quadrantY,
    dimensionScores: detailedScores,
  };
}

/**
 * Compute the weighted composite score from dimension scores.
 * Uses the dimension weights to produce a single 0-10 score.
 */
function computeComposite(
  scores: { dimensionId: string; score: number; weightedScore: number }[],
  dims: { id: string; weight: string; scaleMax: number }[]
): number {
  const totalWeight = dims.reduce((sum, d) => sum + Number(d.weight), 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce((sum, s) => sum + s.weightedScore, 0);

  // Normalize to 0-10 scale
  const maxPossible = dims.reduce((sum, d) => sum + (d.scaleMax * Number(d.weight)), 0);
  if (maxPossible === 0) return 0;

  return Math.round((weightedSum / maxPossible) * 10 * 100) / 100;
}

/**
 * Compute quadrant X/Y position from dimension scores.
 * The domain config's quadrantConfig defines which dimensions map to which axis.
 * Falls back to composite score for both axes if no specific mapping is configured.
 */
async function computeQuadrantPosition(
  domainId: string,
  entityId: string,
  scores: { dimensionId: string; score: number }[],
  dims: { id: string; name: string; scaleMax: number }[]
): Promise<{ quadrantX: number; quadrantY: number }> {
  // Get domain config for quadrant axis mapping
  const { getDomain } = await import("./domain-registry");
  const domain = await getDomain(domainId);

  if (!domain) {
    return { quadrantX: 50, quadrantY: 50 };
  }

  const config = domain.config as unknown as import("./types").DomainConfig;
  const xAxisId = config.quadrantConfig.xAxis.id;
  const yAxisId = config.quadrantConfig.yAxis.id;

  // Find scores for the mapped dimensions
  const scoreMap = new Map(scores.map((s) => [s.dimensionId, s.score]));
  const dimByName = new Map(dims.map((d) => [d.name.toLowerCase(), d]));
  const dimById = new Map(dims.map((d) => [d.id, d]));

  // Try to match by dimension ID first, then by name
  let xScore: number | undefined;
  let yScore: number | undefined;

  for (const [dimId, score] of scoreMap) {
    const dim = dimById.get(dimId);
    if (!dim) continue;
    if (dimId === xAxisId || dim.name.toLowerCase() === xAxisId.toLowerCase()) {
      xScore = score;
    }
    if (dimId === yAxisId || dim.name.toLowerCase() === yAxisId.toLowerCase()) {
      yScore = score;
    }
  }

  // Normalize to 0-100 for quadrant placement
  const normalize = (score: number, max: number) => Math.round((score / max) * 100 * 100) / 100;

  const xMax = dimByName.get(xAxisId.toLowerCase())?.scaleMax ?? 10;
  const yMax = dimByName.get(yAxisId.toLowerCase())?.scaleMax ?? 10;

  return {
    quadrantX: xScore !== undefined ? normalize(xScore, xMax) : 50,
    quadrantY: yScore !== undefined ? normalize(yScore, yMax) : 50,
  };
}

/**
 * Recompute composite scores for all active entities in a domain.
 * Used by the daily score-recompute cron job.
 */
export async function recomputeDomainScores(domainId: string): Promise<number> {
  const entities = await db.select()
    .from(scoredEntities)
    .where(and(
      eq(scoredEntities.domainId, domainId),
      eq(scoredEntities.isActive, true),
    ));

  const dims = await getDomainDimensions(domainId);
  let updated = 0;

  for (const entity of entities) {
    const entityScores = await db.select()
      .from(dimensionScores)
      .where(eq(dimensionScores.entityId, entity.id));

    if (entityScores.length === 0) continue;

    const input: ScoringInput = {
      entityId: entity.id,
      scores: entityScores.map((s) => ({
        dimensionId: s.dimensionId,
        score: Number(s.score),
      })),
    };

    await scoreEntity(domainId, input, "recompute");
    updated++;
  }

  return updated;
}

/**
 * Get the score history for an entity (for trend visualization).
 */
export async function getEntityScoreHistory(entityId: string, limit: number = 30) {
  return db.select()
    .from(engineScoreHistory)
    .where(eq(engineScoreHistory.entityId, entityId))
    .orderBy(desc(engineScoreHistory.recordedAt))
    .limit(limit);
}

/**
 * Get all dimension scores for an entity.
 */
export async function getEntityDimensionScores(entityId: string) {
  return db.select({
    dimensionId: dimensionScores.dimensionId,
    dimensionName: scoringDimensions.name,
    score: dimensionScores.score,
    weight: scoringDimensions.weight,
    scoredAt: dimensionScores.scoredAt,
    source: dimensionScores.source,
  })
    .from(dimensionScores)
    .innerJoin(scoringDimensions, eq(dimensionScores.dimensionId, scoringDimensions.id))
    .where(eq(dimensionScores.entityId, entityId))
    .orderBy(scoringDimensions.displayOrder);
}
