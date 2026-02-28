import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [repo] = await db.select().from(repos).where(eq(repos.id, id));
    if (!repo) return apiError("NOT_FOUND", "Repo not found", 404);
    return apiSuccess(repo);
  } catch (error) {
    console.error("GET /api/v1/admin/repos/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(repos).where(eq(repos.id, id));
    if (!existing) return apiError("NOT_FOUND", "Repo not found", 404);

    if (body.version !== undefined && body.version !== existing.version) {
      return apiError("CONFLICT", "Repo has been modified by another user", 409);
    }

    const [updated] = await db.update(repos).set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.githubOwner !== undefined && { githubOwner: body.githubOwner }),
      ...(body.githubRepo !== undefined && { githubRepo: body.githubRepo }),
      ...(body.githubUrl !== undefined && { githubUrl: body.githubUrl }),
      ...(body.websiteUrl !== undefined && { websiteUrl: body.websiteUrl || null }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.license !== undefined && { license: body.license || null }),
      ...(body.language !== undefined && { language: body.language || null }),
      ...(body.tags !== undefined && { tags: Array.isArray(body.tags) ? body.tags : [] }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.overallScore !== undefined && { overallScore: body.overallScore?.toString() || null }),
      updatedAt: new Date(),
      version: existing.version + 1,
    }).where(eq(repos.id, id)).returning();

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/repos/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [deleted] = await db.delete(repos).where(eq(repos.id, id)).returning();
    if (!deleted) return apiError("NOT_FOUND", "Repo not found", 404);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/admin/repos/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
