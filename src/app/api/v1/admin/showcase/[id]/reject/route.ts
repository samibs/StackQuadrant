import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { showcaseProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [project] = await db.select().from(showcaseProjects).where(eq(showcaseProjects.id, id));
    if (!project) return apiError("NOT_FOUND", "Project not found", 404);

    const [updated] = await db.update(showcaseProjects).set({
      status: "rejected",
      adminNotes: body.reason || null,
      reviewedAt: new Date(),
      reviewedBy: admin.email,
      updatedAt: new Date(),
    }).where(eq(showcaseProjects.id, id)).returning();

    return apiSuccess(updated);
  } catch (error) {
    console.error("POST /api/v1/admin/showcase/[id]/reject error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
