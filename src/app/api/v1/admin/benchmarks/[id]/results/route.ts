import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { benchmarkResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id: benchmarkId } = await params;
    const body = await request.json();
    const { toolId, results, evidence, notes } = body;

    if (!toolId || !results) {
      return apiError("VALIDATION_FAILED", "toolId and results are required", 400);
    }

    const [created] = await db.insert(benchmarkResults).values({
      benchmarkId,
      toolId,
      results,
      evidence: evidence || null,
      runDate: new Date(),
      runBy: admin.email,
      notes: notes || null,
    }).returning();

    return apiSuccess(created, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/admin/benchmarks/[id]/results error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
