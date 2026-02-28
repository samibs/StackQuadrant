import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repoCategories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { validateString, validateSlug, collectErrors } from "@/lib/utils/validate";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const categories = await db.select().from(repoCategories).orderBy(asc(repoCategories.displayOrder));
    return apiSuccess(categories);
  } catch (error) {
    console.error("GET /api/v1/admin/repo-categories error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const { name, slug, description, displayOrder, icon } = body;

    const errors = collectErrors(
      validateString(name, "name", { max: 200 }),
      validateSlug(slug),
      validateString(description, "description", { max: 2000, required: false }),
    );

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const [category] = await db.insert(repoCategories).values({
      name,
      slug,
      description: description || null,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      icon: icon || null,
    }).returning();

    return apiSuccess(category, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A category with this name or slug already exists", 409);
    }
    console.error("POST /api/v1/admin/repo-categories error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
