import { apiSuccess, apiError } from "@/lib/utils/api";
import { getPublishedQuadrants } from "@/lib/db/queries";

export async function GET() {
  try {
    const result = await getPublishedQuadrants();
    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/v1/quadrants error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
