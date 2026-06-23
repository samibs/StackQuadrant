import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { listDoraCategories } from "@/lib/services/finserv-dora-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const categories = await listDoraCategories();
    return apiSuccess({ categories });
  } catch (error) {
    console.error("GET /api/v1/finserv/dora/categories error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
