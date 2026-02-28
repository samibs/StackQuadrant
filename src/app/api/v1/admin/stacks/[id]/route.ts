import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { stacks, stackTools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(stacks).where(eq(stacks.id, id));
    if (!existing) return apiError("NOT_FOUND", "Stack not found", 404);

    if (body.version !== undefined && body.version !== existing.version) {
      return apiError("CONFLICT", "Stack has been modified by another user", 409);
    }

    const [updated] = await db.update(stacks).set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.useCase !== undefined && { useCase: body.useCase }),
      ...(body.projectOutcome !== undefined && { projectOutcome: body.projectOutcome }),
      ...(body.overallScore !== undefined && { overallScore: body.overallScore.toString() }),
      ...(body.metrics !== undefined && { metrics: body.metrics }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.status === "published" && !existing.publishedAt && { publishedAt: new Date() }),
      updatedAt: new Date(),
      version: existing.version + 1,
    }).where(eq(stacks.id, id)).returning();

    // Update stack tools if provided
    if (body.tools && Array.isArray(body.tools)) {
      await db.delete(stackTools).where(eq(stackTools.stackId, id));
      if (body.tools.length > 0) {
        await db.insert(stackTools).values(
          body.tools.map((t: { toolId: string; role: string }) => ({
            stackId: id,
            toolId: t.toolId,
            role: t.role,
          }))
        );
      }
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/stacks/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [deleted] = await db.delete(stacks).where(eq(stacks.id, id)).returning();
    if (!deleted) return apiError("NOT_FOUND", "Stack not found", 404);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/admin/stacks/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
