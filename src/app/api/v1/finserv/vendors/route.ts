import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { listTrackedVendors, addTrackedVendor } from "@/lib/services/finserv-service";
import { getUserTeams, requireTeamAccess } from "@/lib/services/team-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) {
      return apiError("FORBIDDEN", "No team membership found", 403);
    }

    const teamId = userTeams[0].id;
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector") || undefined;

    const vendors = await listTrackedVendors(teamId, sector);
    return apiSuccess({ vendors });
  } catch (error) {
    console.error("GET /api/v1/finserv/vendors error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) {
      return apiError("FORBIDDEN", "No team membership found", 403);
    }

    const team = userTeams[0];
    const access = await requireTeamAccess(user.userId, team.id);
    if (!access || access.role !== "team_admin") {
      return apiError("FORBIDDEN", "Only team admins can add vendors", 403);
    }

    const body = await request.json();
    const { vendorName, vendorAliases, sector } = body;

    if (!vendorName || !sector) {
      return apiError("VALIDATION_FAILED", "vendorName and sector are required", 400);
    }

    const validSectors = ["fund", "banking", "audit", "wealth", "fiduciary", "accounting", "cross-sector"];
    if (!validSectors.includes(sector)) {
      return apiError("VALIDATION_FAILED", `sector must be one of: ${validSectors.join(", ")}`, 400);
    }

    const result = await addTrackedVendor(team.id, { vendorName, vendorAliases, sector });
    if (!result.success) {
      const status = result.code === "PLAN_LIMIT_REACHED" ? 429 : 400;
      return apiError(result.code, result.message, status);
    }

    return apiSuccess(result.vendor, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/vendors error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
