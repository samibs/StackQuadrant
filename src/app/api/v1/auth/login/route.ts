import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { apiError } from "@/lib/utils/api";
import { signToken } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("VALIDATION_FAILED", "Email and password are required", 400, [
        ...(!email ? [{ field: "email", message: "Email is required" }] : []),
        ...(!password ? [{ field: "password", message: "Password is required" }] : []),
      ]);
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    if (!user) {
      return apiError("UNAUTHORIZED", "Invalid email or password", 401);
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return apiError("UNAUTHORIZED", "Invalid email or password", 401);
    }

    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      data: { success: true },
      correlationId: crypto.randomUUID(),
    });

    response.cookies.set("sq-admin-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("POST /api/v1/auth/login error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
