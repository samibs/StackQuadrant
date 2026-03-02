import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { listAlerts, createAlert, deleteAlert } from "@/lib/services/finserv-service";
import { getUserTeams } from "@/lib/services/team-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) {
      return apiError("FORBIDDEN", "No team membership found", 403);
    }

    const alerts = await listAlerts(userTeams[0].id, user.userId);
    return apiSuccess({ alerts });
  } catch (error) {
    console.error("GET /api/v1/finserv/alerts error:", error);
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

    const body = await request.json();
    const { alertType, topicFilter, threshold, channel } = body;

    if (!alertType || !topicFilter || threshold === undefined || !channel) {
      return apiError("VALIDATION_FAILED", "alertType, topicFilter, threshold, and channel are required", 400);
    }

    const validChannels = ["email", "dashboard", "both"];
    if (!validChannels.includes(channel)) {
      return apiError("VALIDATION_FAILED", `channel must be one of: ${validChannels.join(", ")}`, 400);
    }

    const alert = await createAlert({
      teamId: userTeams[0].id,
      userId: user.userId,
      alertType,
      topicFilter,
      threshold,
      channel,
    });

    return apiSuccess(alert, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/alerts error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("id");
    if (!alertId) return apiError("VALIDATION_FAILED", "Alert id is required", 400);

    await deleteAlert(alertId, user.userId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/finserv/alerts error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
