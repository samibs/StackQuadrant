import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getToolBySlug } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const tool = await getToolBySlug(slug);

    if (!tool) {
      return apiError("NOT_FOUND", "Tool not found", 404);
    }

    return apiSuccess(tool);
  } catch (error) {
    console.error("GET /api/v1/tools/[slug] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
