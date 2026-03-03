import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getSectorPains, getSectorById } from "@/lib/services/finserv-service";
import { getUserTeams, requireTeamAccess } from "@/lib/services/team-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ sectorId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { sectorId } = await params;

    const sector = getSectorById(sectorId);
    if (!sector) return apiError("NOT_FOUND", "Sector not found", 404);

    // User must belong to at least one team
    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) {
      return apiError("FORBIDDEN", "No team membership found. Join a team to access FinServ intelligence.", 403);
    }

    // Check sector access on first team (simplification for Phase 1)
    const team = userTeams[0];
    const access = await requireTeamAccess(user.userId, team.id);
    if (!access) return apiError("FORBIDDEN", "No team access", 403);
    if (!access.sectorAccess.includes("all") && !access.sectorAccess.includes(sectorId)) {
      return apiError("FORBIDDEN", "No access to this sector", 403);
    }

    const pains = await getSectorPains(sectorId, team.id);
    return apiSuccess({ sector, pains });
  } catch (error) {
    console.error("GET /api/v1/finserv/sectors/[sectorId]/pains error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
