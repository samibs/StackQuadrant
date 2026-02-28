import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getQuadrantBySlug } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const quadrant = await getQuadrantBySlug(slug);

    if (!quadrant) {
      return apiError("NOT_FOUND", "Quadrant not found", 404);
    }

    return apiSuccess(quadrant);
  } catch (error) {
    console.error("GET /api/v1/quadrants/[slug] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
