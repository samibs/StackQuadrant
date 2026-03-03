import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getSubscription, cancelSubscription } from "@/lib/services/billing-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const subscription = await getSubscription(user.userId);
    if (!subscription) {
      return apiSuccess({ planCode: "free", planName: "Free", status: "active", limits: { scansPerMonth: 1, keywordsPerScan: 3, painPointsPerScan: 10, ideasPerPainPoint: 0, exports: false } });
    }

    return apiSuccess(subscription);
  } catch (error) {
    console.error("GET /api/v1/billing/subscription error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const result = await cancelSubscription(user.userId);
    if (!result.success) {
      return apiError("CANCEL_FAILED", result.error!, 400);
    }

    return apiSuccess({ canceled: true });
  } catch (error) {
    console.error("DELETE /api/v1/billing/subscription error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
