import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils/api";
import { login } from "@/lib/services/auth-service";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/auth/user-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const result = await login({ email, password });

    if (!result.success) {
      const status = result.code === "UNAUTHORIZED" ? 401 : 400;
      return apiError(result.code, result.message, status, result.details);
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
    console.error("POST /api/v1/auth/user-login error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
