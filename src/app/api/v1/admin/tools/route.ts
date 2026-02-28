import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { validateString, validateSlug, validateUrl, validateNumber, validateEnum, collectErrors } from "@/lib/utils/validate";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const allTools = await db.select().from(tools).orderBy(desc(tools.updatedAt));
    return apiSuccess(allTools);
  } catch (error) {
    console.error("GET /api/v1/admin/tools error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const { name, slug, description, websiteUrl, logoUrl, category, vendor, status, overallScore } = body;

    const errors = collectErrors(
      validateString(name, "name", { max: 200 }),
      validateSlug(slug),
      validateString(description, "description", { max: 5000 }),
      validateString(category, "category", { max: 100 }),
      validateString(vendor, "vendor", { max: 200, required: false }),
      validateUrl(websiteUrl, "websiteUrl"),
      validateUrl(logoUrl, "logoUrl"),
      validateEnum(status, "status", ["draft", "published", "archived"], { required: false }),
      validateNumber(overallScore, "overallScore", { min: 0, max: 10 }),
    );

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const [tool] = await db.insert(tools).values({
      name,
      slug,
      description,
      websiteUrl: websiteUrl || null,
      logoUrl: logoUrl || null,
      category,
      vendor: vendor || null,
      status: status || "draft",
      overallScore: overallScore?.toString() || null,
    }).returning();

    return apiSuccess(tool, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A tool with this name or slug already exists", 409);
    }
    console.error("POST /api/v1/admin/tools error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
