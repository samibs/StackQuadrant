import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getRegulation } from "@/lib/services/finserv-service";
import { getUserTeams } from "@/lib/services/team-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ regId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) {
      return apiError("FORBIDDEN", "No team membership found", 403);
    }

    const { regId } = await params;
    const reg = await getRegulation(regId);
    if (!reg) return apiError("NOT_FOUND", "Regulation not found", 404);

    return apiSuccess(reg);
  } catch (error) {
    console.error("GET /api/v1/finserv/regulations/[regId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
