import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getUserProfile, deleteUserAccount, logout } from "@/lib/services/auth-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const profile = await getUserProfile(user.userId);
    if (!profile) return apiError("NOT_FOUND", "User not found", 404);

    return apiSuccess(profile);
  } catch (error) {
    console.error("GET /api/v1/users/me error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    // Revoke all tokens first
    await logout(user.userId);

    // Delete user account (cascades to subscriptions, scans, etc.)
    const deleted = await deleteUserAccount(user.userId);
    if (!deleted) return apiError("NOT_FOUND", "User not found", 404);

    const response = apiSuccess({ deleted: true });

    response.cookies.set("sq-access-token", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
    response.cookies.set("sq-refresh-token", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });

    return response;
  } catch (error) {
    console.error("DELETE /api/v1/users/me error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
