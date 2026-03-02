import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getUserTeams } from "@/lib/services/team-service";
import { getProviderComparison } from "@/lib/services/finserv-fundops-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) return apiError("FORBIDDEN", "No team membership found", 403);

    const { searchParams } = new URL(request.url);
    const vendorIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];

    if (vendorIds.length < 2 || vendorIds.length > 5) {
      return apiError("VALIDATION_FAILED", "Provide 2-5 vendor IDs separated by commas", 400);
    }

    const comparison = await getProviderComparison(userTeams[0].id, vendorIds);
    return apiSuccess(comparison);
  } catch (error) {
    console.error("GET /api/v1/finserv/vendors/compare error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
