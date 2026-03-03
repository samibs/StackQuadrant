// ============================================
// Scan Service — CRUD and orchestration for PainGaps scans
// ============================================

import { db } from "@/lib/db";
import { scans, painPoints, evidenceItems, solutionIdeas } from "@/lib/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { getUserPlan, type PlanConfig } from "@/lib/services/billing-service";
import { createHash } from "crypto";

interface CreateScanInput {
  userId: string;
  targetKeywords: string[];
  targetSubreddits?: string[];
  targetAppCategories?: string[];
  enabledSources: string[];
  timeframeDays: 7 | 30 | 90;
  idempotencyKey?: string;
}

/**
 * Create a new scan, enforcing plan limits.
 */
export async function createScan(input: CreateScanInput): Promise<
  { success: true; scan: typeof scans.$inferSelect } |
  { success: false; code: string; message: string }
> {
  const plan = await getUserPlan(input.userId);

  // Enforce keyword limit
  if (input.targetKeywords.length > plan.limits.keywordsPerScan) {
    return {
      success: false,
      code: "PLAN_LIMIT_REACHED",
      message: `Your ${plan.name} plan allows up to ${plan.limits.keywordsPerScan} keywords per scan`,
    };
  }

  // Enforce monthly scan limit
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [scanCount] = await db
    .select({ count: count() })
    .from(scans)
    .where(and(
      eq(scans.userId, input.userId),
      sql`${scans.createdAt} >= ${monthStart.toISOString()}`
    ));

  if (scanCount.count >= plan.limits.scansPerMonth) {
    return {
      success: false,
      code: "PLAN_LIMIT_REACHED",
      message: `Your ${plan.name} plan allows ${plan.limits.scansPerMonth} scan(s) per month. Upgrade to increase your limit.`,
    };
  }

  // Validate keywords
  const cleanKeywords = input.targetKeywords
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length >= 2 && k.length <= 100);

  if (cleanKeywords.length === 0) {
    return { success: false, code: "VALIDATION_FAILED", message: "At least one valid keyword is required (2-100 characters)" };
  }

  // Validate enabled sources
  const validSources = ["reddit", "appstore", "twitter", "producthunt"];
  const sources = input.enabledSources.filter(s => validSources.includes(s));
  if (sources.length === 0) {
    return { success: false, code: "VALIDATION_FAILED", message: `At least one source required. Valid: ${validSources.join(", ")}` };
  }

  // Idempotency check
  const idempotencyKey = input.idempotencyKey || createHash("sha256")
    .update(`${input.userId}:${cleanKeywords.sort().join(",")}:${sources.sort().join(",")}:${input.timeframeDays}`)
    .digest("hex")
    .slice(0, 64);

  const [existing] = await db.select().from(scans).where(eq(scans.idempotencyKey, idempotencyKey));
  if (existing) {
    return { success: true, scan: existing };
  }

  const [scan] = await db.insert(scans).values({
    userId: input.userId,
    targetKeywords: cleanKeywords,
    targetSubreddits: input.targetSubreddits?.map(s => s.trim().toLowerCase()).filter(Boolean) || null,
    targetAppCategories: input.targetAppCategories?.filter(Boolean) || null,
    enabledSources: sources,
    timeframeDays: input.timeframeDays,
    status: "queued",
    idempotencyKey,
  }).returning();

  return { success: true, scan };
}

/**
 * List scans for a user, newest first.
 */
export async function listScans(userId: string, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const [total] = await db.select({ count: count() }).from(scans).where(eq(scans.userId, userId));

  const rows = await db
    .select()
    .from(scans)
    .where(eq(scans.userId, userId))
    .orderBy(desc(scans.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    scans: rows,
    meta: {
      total: total.count,
      page,
      pageSize,
      totalPages: Math.ceil(total.count / pageSize),
    },
  };
}

/**
 * Get a single scan by ID, verifying ownership.
 */
export async function getScan(scanId: string, userId: string) {
  const [scan] = await db.select().from(scans).where(and(eq(scans.id, scanId), eq(scans.userId, userId)));
  if (!scan) return null;

  // Get pain point count
  const [ppCount] = await db.select({ count: count() }).from(painPoints).where(eq(painPoints.scanId, scanId));

  return { ...scan, painPointCount: ppCount.count };
}

/**
 * Get pain points for a scan with evidence counts.
 */
export async function getScanPainPoints(scanId: string, userId: string) {
  // Verify ownership
  const [scan] = await db.select({ id: scans.id }).from(scans).where(and(eq(scans.id, scanId), eq(scans.userId, userId)));
  if (!scan) return null;

  const points = await db.select().from(painPoints).where(eq(painPoints.scanId, scanId)).orderBy(desc(painPoints.severityScore));

  // Get evidence counts per pain point
  const result = await Promise.all(points.map(async (pp) => {
    const [evCount] = await db.select({ count: count() }).from(evidenceItems).where(eq(evidenceItems.painPointId, pp.id));
    const ideas = await db.select().from(solutionIdeas).where(eq(solutionIdeas.painPointId, pp.id));
    return { ...pp, evidenceCount: evCount.count, solutionIdeas: ideas };
  }));

  return result;
}

/**
 * Get a single pain point with full evidence.
 */
export async function getPainPointDetail(painPointId: string, userId: string) {
  const [pp] = await db.select().from(painPoints).where(eq(painPoints.id, painPointId));
  if (!pp) return null;

  // Verify ownership through scan
  const [scan] = await db.select({ userId: scans.userId }).from(scans).where(eq(scans.id, pp.scanId));
  if (!scan || scan.userId !== userId) return null;

  const evidence = await db.select().from(evidenceItems).where(eq(evidenceItems.painPointId, painPointId)).orderBy(desc(evidenceItems.originalTimestamp));
  const ideas = await db.select().from(solutionIdeas).where(eq(solutionIdeas.painPointId, painPointId));

  return { ...pp, evidence, solutionIdeas: ideas };
}

/**
 * Delete a scan (cascades to pain points, evidence, ideas).
 */
export async function deleteScan(scanId: string, userId: string): Promise<boolean> {
  const result = await db.delete(scans).where(and(eq(scans.id, scanId), eq(scans.userId, userId))).returning({ id: scans.id });
  return result.length > 0;
}

/**
 * Update scan status. Used by the scan runner pipeline.
 */
export async function updateScanStatus(scanId: string, status: "running" | "completed" | "failed", errorCode?: string) {
  const updates: Record<string, unknown> = { status, updatedAt: new Date() };

  if (status === "running") {
    updates.startedAt = new Date();
  } else if (status === "completed" || status === "failed") {
    updates.completedAt = new Date();
  }

  if (errorCode) {
    updates.errorCode = errorCode;
  }

  await db.update(scans).set(updates).where(eq(scans.id, scanId));
}
