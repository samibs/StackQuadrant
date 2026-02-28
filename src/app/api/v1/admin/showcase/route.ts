import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { showcaseProjects } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const status = request.nextUrl.searchParams.get("status");
    let projects;
    if (status) {
      projects = await db.select().from(showcaseProjects)
        .where(eq(showcaseProjects.status, status))
        .orderBy(desc(showcaseProjects.submittedAt));
    } else {
      projects = await db.select().from(showcaseProjects)
        .orderBy(desc(showcaseProjects.submittedAt));
    }
    return apiSuccess(projects);
  } catch (error) {
    console.error("GET /api/v1/admin/showcase error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
