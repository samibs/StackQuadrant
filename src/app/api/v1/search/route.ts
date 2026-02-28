import { apiSuccess, apiError } from "@/lib/utils/api";
import { getSearchIndex } from "@/lib/db/queries";

export async function GET() {
  try {
    const index = await getSearchIndex();
    return apiSuccess(index);
  } catch (error) {
    console.error("GET /api/v1/search error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
