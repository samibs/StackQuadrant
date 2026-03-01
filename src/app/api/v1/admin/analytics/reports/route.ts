import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getReportAnalytics } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const period = request.nextUrl.searchParams.get("period") || "30d";
    const analytics = await getReportAnalytics(period);
    return apiSuccess(analytics);
  } catch (error) {
    console.error("GET /api/v1/admin/analytics/reports error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
