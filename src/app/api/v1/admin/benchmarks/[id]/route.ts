import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { benchmarks, benchmarkResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(benchmarks).where(eq(benchmarks.id, id));
    if (!existing) return apiError("NOT_FOUND", "Benchmark not found", 404);

    if (body.version !== undefined && body.version !== existing.version) {
      return apiError("CONFLICT", "Benchmark has been modified by another user", 409);
    }

    const [updated] = await db.update(benchmarks).set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.methodology !== undefined && { methodology: body.methodology }),
      ...(body.metrics !== undefined && { metrics: body.metrics }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.status === "published" && !existing.publishedAt && { publishedAt: new Date() }),
      updatedAt: new Date(),
      version: existing.version + 1,
    }).where(eq(benchmarks.id, id)).returning();

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/benchmarks/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [deleted] = await db.delete(benchmarks).where(eq(benchmarks.id, id)).returning();
    if (!deleted) return apiError("NOT_FOUND", "Benchmark not found", 404);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/admin/benchmarks/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
