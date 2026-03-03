import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { searchUniverse } from "@/lib/services/universe-service";
import { getUserPlan } from "@/lib/services/billing-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    // Opportunity Universe is Pro-only
    const plan = await getUserPlan(user.userId);
    if (plan.code !== "pro") {
      return apiError("PLAN_LIMIT_REACHED", "Opportunity Universe requires Pro plan", 429);
    }

    const { searchParams } = new URL(request.url);
    const params = {
      keyword: searchParams.get("keyword") || undefined,
      sourceType: searchParams.get("sourceType") || undefined,
      minSeverity: searchParams.get("minSeverity") ? parseInt(searchParams.get("minSeverity")!) : undefined,
      maxSeverity: searchParams.get("maxSeverity") ? parseInt(searchParams.get("maxSeverity")!) : undefined,
      trendDirection: searchParams.get("trendDirection") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 50),
    };

    const result = await searchUniverse(params);
    return apiSuccess(result);
  } catch (error) {
    console.error("GET /api/v1/universe/search error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
