import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getRepoBySlug } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const repo = await getRepoBySlug(slug);
    if (!repo) return apiError("NOT_FOUND", "Repository not found", 404);
    return apiSuccess(repo);
  } catch (error) {
    console.error("GET /api/v1/repos/[slug] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
