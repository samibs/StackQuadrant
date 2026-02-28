import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { repoCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(repoCategories).where(eq(repoCategories.id, id));
    if (!existing) return apiError("NOT_FOUND", "Category not found", 404);

    const [updated] = await db.update(repoCategories).set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
      ...(body.icon !== undefined && { icon: body.icon || null }),
    }).where(eq(repoCategories.id, id)).returning();

    return apiSuccess(updated);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A category with this name or slug already exists", 409);
    }
    console.error("PUT /api/v1/admin/repo-categories/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [deleted] = await db.delete(repoCategories).where(eq(repoCategories.id, id)).returning();
    if (!deleted) return apiError("NOT_FOUND", "Category not found", 404);
    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("foreign")) {
      return apiError("CONFLICT", "Cannot delete category that has repos assigned to it", 409);
    }
    console.error("DELETE /api/v1/admin/repo-categories/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
