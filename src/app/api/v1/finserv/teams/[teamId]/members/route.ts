import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getTeamMembers, addTeamMember, removeTeamMember, requireTeamAdmin } from "@/lib/services/team-service";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { teamId } = await params;
    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can view members", 403);

    const members = await getTeamMembers(teamId);
    return apiSuccess({ members });
  } catch (error) {
    console.error("GET /api/v1/finserv/teams/[teamId]/members error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { teamId } = await params;
    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can add members", 403);

    const body = await request.json();
    const { email, role, sectorAccess } = body;

    if (!email) return apiError("VALIDATION_FAILED", "email is required", 400);

    const validRoles = ["team_admin", "team_member"];
    if (role && !validRoles.includes(role)) {
      return apiError("VALIDATION_FAILED", `role must be one of: ${validRoles.join(", ")}`, 400);
    }

    // Find user by email
    const [targetUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (!targetUser) {
      return apiError("NOT_FOUND", "No user found with that email. They must sign up first.", 404);
    }

    const result = await addTeamMember(teamId, targetUser.id, role || "team_member", sectorAccess);
    if (!result.success) {
      const status = result.code === "PLAN_LIMIT_REACHED" ? 429 : 400;
      return apiError(result.code, result.message, status);
    }

    return apiSuccess(result.member, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/teams/[teamId]/members error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { teamId } = await params;
    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can remove members", 403);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return apiError("VALIDATION_FAILED", "userId query parameter is required", 400);

    // Prevent removing yourself if you're the last admin
    if (userId === user.userId) {
      return apiError("VALIDATION_FAILED", "Cannot remove yourself. Transfer admin role first.", 400);
    }

    await removeTeamMember(teamId, userId);
    return apiSuccess({ removed: true });
  } catch (error) {
    console.error("DELETE /api/v1/finserv/teams/[teamId]/members error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
