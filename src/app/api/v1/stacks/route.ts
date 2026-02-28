import { apiSuccess, apiError } from "@/lib/utils/api";
import { getPublishedStacks } from "@/lib/db/queries";

export async function GET() {
  try {
    const result = await getPublishedStacks();
    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/v1/stacks error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
