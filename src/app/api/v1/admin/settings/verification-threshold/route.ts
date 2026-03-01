import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getAppSetting, setAppSetting } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const threshold = await getAppSetting("verification_threshold");
    return apiSuccess({ threshold: threshold ?? 3 });
  } catch (error) {
    console.error("GET verification-threshold error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();
    const threshold = parseInt(String(body.threshold), 10);

    if (isNaN(threshold) || threshold < 2 || threshold > 20) {
      return apiError("VALIDATION_FAILED", "Threshold must be between 2 and 20", 400);
    }

    await setAppSetting("verification_threshold", threshold, admin.email);
    return apiSuccess({ threshold });
  } catch (error) {
    console.error("PUT verification-threshold error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
