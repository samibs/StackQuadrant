import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { logout } from "@/lib/services/auth-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    await logout(user.userId);

    const response = NextResponse.json({
      data: { success: true },
      correlationId: crypto.randomUUID(),
    });

    response.cookies.set("sq-access-token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("sq-refresh-token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("POST /api/v1/auth/user-logout error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
