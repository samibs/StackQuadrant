import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils/api";
import { signup } from "@/lib/services/auth-service";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/auth/user-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    const result = await signup({ email, password, fullName });

    if (!result.success) {
      const status = result.code === "CONFLICT" ? 409 : 400;
      return apiError(result.code, result.message, status, result.details);
    }

    const response = NextResponse.json({
      data: {
        userId: result.userId,
        email: result.email,
        role: result.role,
      },
      correlationId: crypto.randomUUID(),
    }, { status: 201 });

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
    console.error("POST /api/v1/auth/signup error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
