import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getToolsBySlugs } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get("tools");
  if (!slugsParam) {
    return apiError("VALIDATION_FAILED", "tools parameter is required (comma-separated slugs)", 400);
  }

  const slugs = slugsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (slugs.length < 2) {
    return apiError("VALIDATION_FAILED", "At least 2 tools are required for comparison", 400);
  }

  try {
    const tools = await getToolsBySlugs(slugs);
    return apiSuccess(tools);
  } catch (error) {
    console.error("GET /api/v1/compare error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
