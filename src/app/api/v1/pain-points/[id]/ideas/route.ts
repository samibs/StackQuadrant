import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { generateIdeas } from "@/lib/services/idea-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { id } = await params;
    const result = await generateIdeas(id, user.userId);

    if (!result.success) {
      const status = result.code === "PLAN_LIMIT_REACHED" ? 429 : result.code === "NOT_FOUND" ? 404 : 500;
      return apiError(result.code, result.message, status);
    }

    return apiSuccess(result.ideas, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/pain-points/[id]/ideas error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
