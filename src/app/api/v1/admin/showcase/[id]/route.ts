import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { showcaseProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const [project] = await db.select().from(showcaseProjects).where(eq(showcaseProjects.id, id));
    if (!project) return apiError("NOT_FOUND", "Project not found", 404);
    return apiSuccess(project);
  } catch (error) {
    console.error("GET /api/v1/admin/showcase/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.select().from(showcaseProjects).where(eq(showcaseProjects.id, id));
    if (!existing) return apiError("NOT_FOUND", "Project not found", 404);

    const [updated] = await db.update(showcaseProjects).set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.projectUrl !== undefined && { projectUrl: body.projectUrl }),
      ...(body.githubUrl !== undefined && { githubUrl: body.githubUrl || null }),
      ...(body.screenshotUrl !== undefined && { screenshotUrl: body.screenshotUrl || null }),
      ...(body.techStack !== undefined && { techStack: Array.isArray(body.techStack) ? body.techStack : [] }),
      ...(body.aiToolsUsed !== undefined && { aiToolsUsed: Array.isArray(body.aiToolsUsed) ? body.aiToolsUsed : [] }),
      ...(body.timeToBuild !== undefined && { timeToBuild: body.timeToBuild || null }),
      ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes || null }),
      ...(body.status !== undefined && { status: body.status }),
      updatedAt: new Date(),
    }).where(eq(showcaseProjects.id, id)).returning();

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/showcase/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
