import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { toolScores, dimensions } from "@/lib/db/schema";
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
    const { scores } = body as { scores: Array<{ dimensionId: string; score: number; evidence?: string }> };

    if (!scores || !Array.isArray(scores)) {
      return apiError("VALIDATION_FAILED", "Scores array is required", 400);
    }

    const results = [];
    for (const s of scores) {
      const [existing] = await db.select().from(toolScores)
        .where(and(eq(toolScores.toolId, toolId), eq(toolScores.dimensionId, s.dimensionId)));

      if (existing) {
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

    return apiSuccess(results);
  } catch (error) {
    console.error("PUT /api/v1/admin/tools/[id]/scores error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
