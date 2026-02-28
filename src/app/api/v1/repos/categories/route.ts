import { apiSuccess, apiError } from "@/lib/utils/api";
import { getRepoCategories } from "@/lib/db/queries";

export async function GET() {
  try {
    const categories = await getRepoCategories();
    return apiSuccess(categories);
  } catch (error) {
    console.error("GET /api/v1/repos/categories error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
