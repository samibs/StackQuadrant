import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { validateString, validateSlug, validateEnum, collectErrors } from "@/lib/utils/validate";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const all = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    return apiSuccess(all);
  } catch (error) {
    console.error("GET /api/v1/admin/blog error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, category, tags, status } = body;

    const errors = collectErrors(
      validateString(title, "title", { max: 300 }),
      validateSlug(slug),
      validateString(excerpt, "excerpt", { max: 2000 }),
      validateString(content, "content", { max: 100000 }),
      validateString(category, "category", { max: 100 }),
      validateEnum(status, "status", ["draft", "published"], { required: false }),
    );

    if (errors.length > 0) {
      return apiError("VALIDATION_ERROR", errors.map((e) => `${e.field}: ${e.message}`).join("; "), 400);
    }

    const now = new Date();
    const publishedAt = (status || "draft") === "published" ? now : null;

    const [post] = await db.insert(blogPosts).values({
      title,
      slug,
      excerpt,
      content,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status: status || "draft",
      publishedAt,
      updatedAt: now,
    }).returning();

    return apiSuccess(post, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A blog post with this slug already exists", 409);
    }
    console.error("POST /api/v1/admin/blog error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
