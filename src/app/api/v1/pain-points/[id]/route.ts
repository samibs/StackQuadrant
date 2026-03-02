import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getPainPointDetail } from "@/lib/services/scan-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { id } = await params;
    const detail = await getPainPointDetail(id, user.userId);
    if (!detail) return apiError("NOT_FOUND", "Pain point not found", 404);

    return apiSuccess(detail);
  } catch (error) {
    console.error("GET /api/v1/pain-points/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
