import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getUserTeams } from "@/lib/services/team-service";
import { getTalentPains } from "@/lib/services/finserv-practice-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) return apiError("FORBIDDEN", "No team membership found", 403);

    const data = await getTalentPains(userTeams[0].id);
    return apiSuccess(data);
  } catch (error) {
    console.error("GET /api/v1/finserv/practice/talent error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
