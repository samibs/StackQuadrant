import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getSectors } from "@/lib/services/finserv-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const sectors = getSectors();
    return apiSuccess({ sectors });
  } catch (error) {
    console.error("GET /api/v1/finserv/sectors error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
