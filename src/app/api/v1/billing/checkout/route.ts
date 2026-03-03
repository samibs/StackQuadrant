import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { createCheckoutSession } from "@/lib/services/billing-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const body = await request.json();
    const { planCode } = body;

    if (!planCode || !["starter", "pro"].includes(planCode)) {
      return apiError("VALIDATION_FAILED", "planCode must be 'starter' or 'pro'", 400);
    }

    const origin = request.nextUrl.origin;
    const result = await createCheckoutSession({
      userId: user.userId,
      email: user.email,
      planCode,
      successUrl: `${origin}/account?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=canceled`,
    });

    if ("error" in result) {
      return apiError("CHECKOUT_FAILED", result.error, 400);
    }

    return apiSuccess({ checkoutUrl: result.url });
  } catch (error) {
    console.error("POST /api/v1/billing/checkout error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
