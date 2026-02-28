import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { stacks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { validateString, validateSlug, validateNumber, validateEnum, collectErrors } from "@/lib/utils/validate";

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

    const errors = collectErrors(
      validateString(name, "name", { max: 200 }),
      validateSlug(slug),
      validateString(description, "description", { max: 5000 }),
      validateString(useCase, "useCase", { max: 2000 }),
      validateString(projectOutcome, "projectOutcome", { max: 2000 }),
      validateNumber(overallScore, "overallScore", { min: 0, max: 10, required: true }),
      validateEnum(status, "status", ["draft", "published", "archived"], { required: false }),
    );
    if (!metrics || typeof metrics !== "object") {
      errors.push({ field: "metrics", message: "metrics is required and must be an object" });
    }
    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
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
