import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { showcaseProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();
    const { works, codeQuality, shipped } = body as { works: number; codeQuality: number; shipped: number };

    const [project] = await db.select().from(showcaseProjects).where(eq(showcaseProjects.id, id));
    if (!project) return apiError("NOT_FOUND", "Project not found", 404);

    // Validate scores
    for (const [label, score] of [["works", works], ["codeQuality", codeQuality], ["shipped", shipped]] as const) {
      if (typeof score !== "number" || score < 0 || score > 10) {
        return apiError("VALIDATION_FAILED", `${label} must be 0-10`, 400);
      }
    }

    const overallQuality = ((works + codeQuality + shipped) / 3).toFixed(1);

    const [updated] = await db.update(showcaseProjects).set({
      qualityScore: overallQuality,
      qualityBreakdown: { works, codeQuality, shipped },
      updatedAt: new Date(),
    }).where(eq(showcaseProjects.id, id)).returning();

    return apiSuccess(updated);
  } catch (error) {
    console.error("POST /api/v1/admin/showcase/[id]/score error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
