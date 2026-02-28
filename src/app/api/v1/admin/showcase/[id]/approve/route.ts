import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { showcaseProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendShowcaseApprovalEmail } from "@/lib/utils/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [project] = await db.select().from(showcaseProjects).where(eq(showcaseProjects.id, id));
    if (!project) return apiError("NOT_FOUND", "Project not found", 404);

    if (project.status === "published") {
      return apiError("CONFLICT", "Project is already published", 409);
    }

    const [updated] = await db.update(showcaseProjects).set({
      status: "published",
      reviewedAt: new Date(),
      reviewedBy: admin.email,
      publishedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(showcaseProjects.id, id)).returning();

    // Notify builder
    await sendShowcaseApprovalEmail(project.builderEmail, project.name, project.slug).catch((err) => {
      console.error("Failed to send approval email:", err);
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("POST /api/v1/admin/showcase/[id]/approve error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
