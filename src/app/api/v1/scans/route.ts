import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { createScan, listScans } from "@/lib/services/scan-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const body = await request.json();
    const { targetKeywords, targetSubreddits, targetAppCategories, enabledSources, timeframeDays, idempotencyKey } = body;

    if (!Array.isArray(targetKeywords) || targetKeywords.length === 0) {
      return apiError("VALIDATION_FAILED", "targetKeywords must be a non-empty array", 400);
    }
    if (!Array.isArray(enabledSources) || enabledSources.length === 0) {
      return apiError("VALIDATION_FAILED", "enabledSources must be a non-empty array", 400);
    }
    if (![7, 30, 90].includes(timeframeDays)) {
      return apiError("VALIDATION_FAILED", "timeframeDays must be 7, 30, or 90", 400);
    }

    const result = await createScan({
      userId: user.userId,
      targetKeywords,
      targetSubreddits,
      targetAppCategories,
      enabledSources,
      timeframeDays,
      idempotencyKey,
    });

    if (!result.success) {
      const status = result.code === "PLAN_LIMIT_REACHED" ? 429 : 400;
      return apiError(result.code, result.message, status);
    }

    return apiSuccess(result.scan, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/scans error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(100, parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10));

    const result = await listScans(user.userId, page, pageSize);
    return apiSuccess(result.scans, result.meta);
  } catch (error) {
    console.error("GET /api/v1/scans error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
