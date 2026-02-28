import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { tools, toolScores, dimensions, scoreHistory, overallScoreHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const scores = await db.select({
      id: toolScores.id,
      dimensionId: toolScores.dimensionId,
      dimensionName: dimensions.name,
      score: toolScores.score,
      evidence: toolScores.evidence,
      evaluatedAt: toolScores.evaluatedAt,
      evaluatedBy: toolScores.evaluatedBy,
    })
      .from(toolScores)
      .innerJoin(dimensions, eq(toolScores.dimensionId, dimensions.id))
      .where(eq(toolScores.toolId, id));

    return apiSuccess(scores);
  } catch (error) {
    console.error("GET /api/v1/admin/tools/[id]/scores error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id: toolId } = await params;
    const body = await request.json();
    const { scores, changeReason } = body as {
      scores: Array<{ dimensionId: string; score: number; evidence?: string }>;
      changeReason?: string;
    };

    if (!scores || !Array.isArray(scores) || scores.length === 0 || scores.length > 50) {
      return apiError("VALIDATION_FAILED", "Scores must be a non-empty array (max 50)", 400);
    }

    for (const s of scores) {
      if (!s.dimensionId || typeof s.dimensionId !== "string") {
        return apiError("VALIDATION_FAILED", "Each score must have a dimensionId", 400);
      }
      const score = Number(s.score);
      if (isNaN(score) || score < 0 || score > 10) {
        return apiError("VALIDATION_FAILED", "Each score must be between 0 and 10", 400);
      }
      if (s.evidence && (typeof s.evidence !== "string" || s.evidence.length > 5000)) {
        return apiError("VALIDATION_FAILED", "Evidence must be a string under 5000 characters", 400);
      }
    }

    // Get current overall score before changes
    const [currentTool] = await db.select({ overallScore: tools.overallScore }).from(tools).where(eq(tools.id, toolId));
    const oldOverallScore = currentTool?.overallScore ? parseFloat(currentTool.overallScore) : null;

    const results = [];
    for (const s of scores) {
      const [existing] = await db.select().from(toolScores)
        .where(and(eq(toolScores.toolId, toolId), eq(toolScores.dimensionId, s.dimensionId)));

      if (existing) {
        const oldScore = parseFloat(existing.score);
        const newScore = Number(s.score);

        // Archive to history if score changed
        if (Math.abs(oldScore - newScore) >= 0.05) {
          await db.insert(scoreHistory).values({
            toolId,
            dimensionId: s.dimensionId,
            oldScore: existing.score,
            newScore: newScore.toString(),
            changeReason: changeReason || null,
            changedBy: admin.email,
          });
        }

        const [updated] = await db.update(toolScores).set({
          score: s.score.toString(),
          evidence: s.evidence || existing.evidence,
          evaluatedAt: new Date(),
          evaluatedBy: admin.email,
        }).where(eq(toolScores.id, existing.id)).returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(toolScores).values({
          toolId,
          dimensionId: s.dimensionId,
          score: s.score.toString(),
          evidence: s.evidence || null,
          evaluatedBy: admin.email,
        }).returning();
        results.push(created);
      }
    }

    // Recalculate overall score from weighted dimensions
    const allScores = await db.select({
      score: toolScores.score,
      weight: dimensions.weight,
    })
      .from(toolScores)
      .innerJoin(dimensions, eq(toolScores.dimensionId, dimensions.id))
      .where(eq(toolScores.toolId, toolId));

    if (allScores.length > 0) {
      let weightedSum = 0;
      let totalWeight = 0;
      for (const s of allScores) {
        const w = parseFloat(s.weight);
        weightedSum += parseFloat(s.score) * w;
        totalWeight += w;
      }
      const newOverallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const roundedOverall = Math.round(newOverallScore * 10) / 10;

      await db.update(tools).set({
        overallScore: roundedOverall.toString(),
        updatedAt: new Date(),
      }).where(eq(tools.id, toolId));

      // Archive overall score change
      if (oldOverallScore !== null && Math.abs(oldOverallScore - roundedOverall) >= 0.05) {
        await db.insert(overallScoreHistory).values({
          toolId,
          oldScore: oldOverallScore.toString(),
          newScore: roundedOverall.toString(),
        });
      }
    }

    return apiSuccess(results);
  } catch (error) {
    console.error("PUT /api/v1/admin/tools/[id]/scores error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
