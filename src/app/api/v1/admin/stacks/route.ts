import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { stacks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const all = await db.select().from(stacks).orderBy(desc(stacks.updatedAt));
    return apiSuccess(all);
  } catch (error) {
    console.error("GET /api/v1/admin/stacks error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const { name, slug, description, useCase, projectOutcome, overallScore, metrics, status } = body;

    if (!name || !slug || !description || !useCase || !projectOutcome || overallScore === undefined || !metrics) {
      return apiError("VALIDATION_FAILED", "Missing required fields", 400);
    }

    const [created] = await db.insert(stacks).values({
      name, slug, description, useCase, projectOutcome,
      overallScore: overallScore.toString(),
      metrics,
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : null,
    }).returning();

    return apiSuccess(created, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A stack with this slug already exists", 409);
    }
    console.error("POST /api/v1/admin/stacks error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
