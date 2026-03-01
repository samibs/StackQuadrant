import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getTopAskQueries, getWidgetEngagementStats } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const period = request.nextUrl.searchParams.get("period") || "30d";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20", 10);
    const site = request.nextUrl.searchParams.get("site") || undefined;

    const [questions, engagement] = await Promise.all([
      getTopAskQueries(period, limit, site),
      getWidgetEngagementStats(period, site),
    ]);

    return apiSuccess({ questions, engagement });
  } catch (error) {
    console.error("GET /api/v1/admin/analytics/questions error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
