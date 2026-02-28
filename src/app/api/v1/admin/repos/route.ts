import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { validateString, validateSlug, validateUrl, collectErrors } from "@/lib/utils/validate";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const allRepos = await db.select().from(repos).orderBy(desc(repos.updatedAt));
    return apiSuccess(allRepos);
  } catch (error) {
    console.error("GET /api/v1/admin/repos error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const { name, slug, description, githubOwner, githubRepo, githubUrl, websiteUrl, logoUrl, categoryId, license, language, tags, status } = body;

    const errors = collectErrors(
      validateString(name, "name", { max: 300 }),
      validateSlug(slug),
      validateString(description, "description", { max: 5000 }),
      validateString(githubOwner, "githubOwner", { max: 200 }),
      validateString(githubRepo, "githubRepo", { max: 200 }),
      validateUrl(githubUrl, "githubUrl"),
      validateUrl(websiteUrl, "websiteUrl"),
      validateUrl(logoUrl, "logoUrl"),
      validateString(categoryId, "categoryId", { max: 100 }),
    );

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const [repo] = await db.insert(repos).values({
      name,
      slug,
      description,
      githubOwner,
      githubRepo,
      githubUrl,
      websiteUrl: websiteUrl || null,
      logoUrl: logoUrl || null,
      categoryId,
      license: license || null,
      language: language || null,
      tags: Array.isArray(tags) ? tags : [],
      status: status || "draft",
    }).returning();

    return apiSuccess(repo, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A repo with this name, slug, or GitHub owner/repo already exists", 409);
    }
    console.error("POST /api/v1/admin/repos error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
