import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getAppSetting, setAppSetting } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const [threshold, minSubmissions, enabled] = await Promise.all([
      getAppSetting("auto_approve_threshold"),
      getAppSetting("auto_approve_min_submissions"),
      getAppSetting("auto_approve_enabled"),
    ]);

    return apiSuccess({
      threshold: typeof threshold === "number" ? threshold : 90,
      minSubmissions: typeof minSubmissions === "number" ? minSubmissions : 10,
      enabled: enabled === true,
    });
  } catch (error) {
    console.error("GET auto-approve error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();

    if (body.threshold !== undefined) {
      const threshold = parseInt(String(body.threshold), 10);
      if (isNaN(threshold) || threshold < 50 || threshold > 100) {
        return apiError("VALIDATION_FAILED", "Threshold must be between 50 and 100", 400);
      }
      await setAppSetting("auto_approve_threshold", threshold, admin.email);
    }

    if (body.minSubmissions !== undefined) {
      const minSubmissions = parseInt(String(body.minSubmissions), 10);
      if (isNaN(minSubmissions) || minSubmissions < 3 || minSubmissions > 50) {
        return apiError("VALIDATION_FAILED", "Min submissions must be between 3 and 50", 400);
      }
      await setAppSetting("auto_approve_min_submissions", minSubmissions, admin.email);
    }

    if (body.enabled !== undefined) {
      await setAppSetting("auto_approve_enabled", body.enabled === true, admin.email);
    }

    const [threshold, minSubmissions, enabled] = await Promise.all([
      getAppSetting("auto_approve_threshold"),
      getAppSetting("auto_approve_min_submissions"),
      getAppSetting("auto_approve_enabled"),
    ]);

    return apiSuccess({
      threshold: typeof threshold === "number" ? threshold : 90,
      minSubmissions: typeof minSubmissions === "number" ? minSubmissions : 10,
      enabled: enabled === true,
    });
  } catch (error) {
    console.error("PUT auto-approve error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
