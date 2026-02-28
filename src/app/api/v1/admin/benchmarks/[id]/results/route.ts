import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { benchmarkResults } from "@/lib/db/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id: benchmarkId } = await params;
    const body = await request.json();
    const { toolId, results, evidence, notes } = body;

    const errors: Array<{ field: string; message: string }> = [];

    if (typeof toolId !== "string" || !UUID_RE.test(toolId)) {
      errors.push({ field: "toolId", message: "Must be a valid UUID" });
    }

    if (!results || typeof results !== "object" || Array.isArray(results)) {
      errors.push({ field: "results", message: "Must be a non-null object" });
    } else {
      const entries = Object.entries(results);
      if (entries.length === 0) {
        errors.push({ field: "results", message: "Must have at least one metric" });
      } else if (entries.length > 50) {
        errors.push({ field: "results", message: "Maximum 50 metrics allowed" });
      } else {
        for (const [key, value] of entries) {
          if (typeof value !== "number" || !isFinite(value as number)) {
            errors.push({ field: `results.${key}`, message: "Must be a finite number" });
          }
        }
      }
    }

    if (evidence !== undefined && evidence !== null && typeof evidence !== "string") {
      errors.push({ field: "evidence", message: "Must be a string" });
    }
    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      errors.push({ field: "notes", message: "Must be a string" });
    }

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid benchmark result data", 400, errors);
    }

    const [created] = await db.insert(benchmarkResults).values({
      benchmarkId,
      toolId,
      results: results as Record<string, number>,
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
