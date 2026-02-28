import { apiSuccess, apiError } from "@/lib/utils/api";
import { getPublishedBenchmarks } from "@/lib/db/queries";

export async function GET() {
  try {
    const result = await getPublishedBenchmarks();
    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/v1/benchmarks error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
