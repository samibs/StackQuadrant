import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { createTeam, getUserTeams, updateTeam, deleteTeam, requireTeamAdmin } from "@/lib/services/team-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const teams = await getUserTeams(user.userId);
    return apiSuccess({ teams });
  } catch (error) {
    console.error("GET /api/v1/finserv/teams error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const body = await request.json();
    const { name, planCode } = body;

    if (!name || !planCode) {
      return apiError("VALIDATION_FAILED", "name and planCode are required", 400);
    }

    const validPlans = ["analyst", "team", "business", "enterprise"];
    if (!validPlans.includes(planCode)) {
      return apiError("VALIDATION_FAILED", `planCode must be one of: ${validPlans.join(", ")}`, 400);
    }

    const team = await createTeam(name, planCode, user.userId);
    return apiSuccess(team, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/teams error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const body = await request.json();
    const { teamId, name, settings } = body;

    if (!teamId) return apiError("VALIDATION_FAILED", "teamId is required", 400);

    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can update the team", 403);

    const updated = await updateTeam(teamId, { name, settings });
    if (!updated) return apiError("NOT_FOUND", "Team not found", 404);

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/finserv/teams error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) return apiError("VALIDATION_FAILED", "teamId is required", 400);

    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can delete the team", 403);

    await deleteTeam(teamId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/finserv/teams error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
