import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { tools } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

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

    if (!name || !slug || !description || !category) {
      return apiError("VALIDATION_FAILED", "Missing required fields", 400, [
        ...(!name ? [{ field: "name", message: "Name is required" }] : []),
        ...(!slug ? [{ field: "slug", message: "Slug is required" }] : []),
        ...(!description ? [{ field: "description", message: "Description is required" }] : []),
        ...(!category ? [{ field: "category", message: "Category is required" }] : []),
      ]);
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
