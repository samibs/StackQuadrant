import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { quadrants } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { validateString, validateSlug, validateEnum, collectErrors } from "@/lib/utils/validate";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const all = await db.select().from(quadrants).orderBy(desc(quadrants.updatedAt));
    return apiSuccess(all);
  } catch (error) {
    console.error("GET /api/v1/admin/quadrants error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const { title, slug, description, xAxisLabel, yAxisLabel, quadrantLabels, status } = body;

    const errors = collectErrors(
      validateString(title, "title", { max: 200 }),
      validateSlug(slug),
      validateString(description, "description", { max: 5000 }),
      validateString(xAxisLabel, "xAxisLabel", { max: 100 }),
      validateString(yAxisLabel, "yAxisLabel", { max: 100 }),
      validateEnum(status, "status", ["draft", "published", "archived"], { required: false }),
    );
    if (!quadrantLabels || typeof quadrantLabels !== "object") {
      errors.push({ field: "quadrantLabels", message: "quadrantLabels is required and must be an object" });
    }
    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const [created] = await db.insert(quadrants).values({
      title, slug, description, xAxisLabel, yAxisLabel, quadrantLabels,
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : null,
    }).returning();

    return apiSuccess(created, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A quadrant with this slug already exists", 409);
    }
    console.error("POST /api/v1/admin/quadrants error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
