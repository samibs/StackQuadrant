import { NextRequest } from "next/server";
import { apiSuccess, apiError, parsePageParams } from "@/lib/utils/api";
import { getPublishedTools } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const params = parsePageParams(request.nextUrl.searchParams);
    const result = await getPublishedTools(params);

    return apiSuccess(result.tools, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    });
  } catch (error) {
    console.error("GET /api/v1/tools error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
