import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repos, repoScores, repoDimensions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();
    const { scores } = body as { scores: Array<{ dimensionId: string; score: number; evidence?: string }> };

    const [repo] = await db.select().from(repos).where(eq(repos.id, id));
    if (!repo) return apiError("NOT_FOUND", "Repo not found", 404);

    if (!Array.isArray(scores) || scores.length === 0) {
      return apiError("VALIDATION_FAILED", "scores array is required", 400);
    }

    // Validate scores
    for (const s of scores) {
      if (typeof s.score !== "number" || s.score < 0 || s.score > 10) {
        return apiError("VALIDATION_FAILED", `Score must be 0-10, got ${s.score}`, 400);
      }
    }

    // Upsert each score
    for (const s of scores) {
      const existing = await db.select().from(repoScores)
        .where(eq(repoScores.repoId, id))
        .then((rows) => rows.find((r) => r.dimensionId === s.dimensionId));

      if (existing) {
        await db.update(repoScores).set({
          score: s.score.toString(),
          evidence: s.evidence || existing.evidence,
          evaluatedAt: new Date(),
          evaluatedBy: admin.email,
        }).where(eq(repoScores.id, existing.id));
      } else {
        await db.insert(repoScores).values({
          repoId: id,
          dimensionId: s.dimensionId,
          score: s.score.toString(),
          evidence: s.evidence || null,
          evaluatedBy: admin.email,
        });
      }
    }

    // Recalculate overall score
    const allDimensions = await db.select().from(repoDimensions).orderBy(asc(repoDimensions.displayOrder));
    const allScores = await db.select().from(repoScores).where(eq(repoScores.repoId, id));

    const scoreMap = new Map(allScores.map((s) => [s.dimensionId, parseFloat(s.score)]));
    let totalWeight = 0;
    let weightedSum = 0;

    for (const dim of allDimensions) {
      const score = scoreMap.get(dim.id);
      if (score !== undefined) {
        const w = parseFloat(dim.weight);
        weightedSum += score * w;
        totalWeight += w;
      }
    }

    const overallScore = totalWeight > 0 ? (weightedSum / totalWeight) : null;

    await db.update(repos).set({
      overallScore: overallScore?.toFixed(1) || null,
      updatedAt: new Date(),
    }).where(eq(repos.id, id));

    return apiSuccess({ overallScore: overallScore?.toFixed(1), scoresUpdated: scores.length });
  } catch (error) {
    console.error("PUT /api/v1/admin/repos/[id]/scores error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
