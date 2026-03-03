import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getUserTeams, requireTeamAdmin } from "@/lib/services/team-service";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/services/api-key-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) return apiError("FORBIDDEN", "No team membership found", 403);

    const keys = await listApiKeys(userTeams[0].id);
    return apiSuccess({ keys });
  } catch (error) {
    console.error("GET /api/v1/finserv/api-keys error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) return apiError("FORBIDDEN", "No team membership found", 403);

    const teamId = userTeams[0].id;
    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can create API keys", 403);

    const body = await request.json();
    const { name, scopes } = body;

    if (!name) return apiError("VALIDATION_FAILED", "name is required", 400);

    const validScopes = ["read", "write", "admin"];
    if (scopes && !scopes.every((s: string) => validScopes.includes(s))) {
      return apiError("VALIDATION_FAILED", `scopes must be from: ${validScopes.join(", ")}`, 400);
    }

    const result = await createApiKey(teamId, user.userId, name, scopes || ["read"]);
    if (!result.success) {
      const status = result.code === "PLAN_LIMIT_REACHED" ? 429 : 400;
      return apiError(result.code, result.message, status);
    }

    return apiSuccess({
      id: result.key.id,
      name: result.key.name,
      keyPrefix: result.key.keyPrefix,
      scopes: result.key.scopes,
      rawKey: result.key.rawKey, // Returned only once
    }, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/api-keys error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) return apiError("FORBIDDEN", "No team membership found", 403);

    const teamId = userTeams[0].id;
    const isAdmin = await requireTeamAdmin(user.userId, teamId);
    if (!isAdmin) return apiError("FORBIDDEN", "Only team admins can revoke API keys", 403);

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    if (!keyId) return apiError("VALIDATION_FAILED", "id is required", 400);

    const revoked = await revokeApiKey(keyId, teamId);
    if (!revoked) return apiError("NOT_FOUND", "API key not found", 404);

    return apiSuccess({ revoked: true });
  } catch (error) {
    console.error("DELETE /api/v1/finserv/api-keys error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
