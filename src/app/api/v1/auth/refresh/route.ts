import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils/api";
import { refreshSession } from "@/lib/services/auth-service";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/auth/user-auth";

export async function POST(request: NextRequest) {
  try {
    const rawRefreshToken = request.cookies.get("sq-refresh-token")?.value;

    if (!rawRefreshToken) {
      return apiError("UNAUTHORIZED", "No refresh token provided", 401);
    }

    const result = await refreshSession(rawRefreshToken);

    if (!result.success) {
      // Clear cookies on failure
      const response = apiError(result.code, result.message, 401);
      response.cookies.set("sq-access-token", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
      response.cookies.set("sq-refresh-token", "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
      return response;
    }

    const response = NextResponse.json({
      data: {
        userId: result.userId,
        email: result.email,
        role: result.role,
      },
      correlationId: crypto.randomUUID(),
    });

    response.cookies.set("sq-access-token", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set("sq-refresh-token", result.refreshTokenRaw, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("POST /api/v1/auth/refresh error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
