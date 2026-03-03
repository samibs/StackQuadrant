import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { addSupportVote, checkAndApplyCommunityVerification } from "@/lib/db/queries";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success: rateLimitOk } = rateLimit(`widget:support:${ip}`, 10, 3600000);
    if (!rateLimitOk) {
      return apiError("RATE_LIMITED", "Too many support votes. Please try again later.", 429);
    }

    const body = await request.json();
    const { suggestionId, evidence, email } = body;

    if (!suggestionId || typeof suggestionId !== "string") {
      return apiError("VALIDATION_FAILED", "suggestionId is required", 400);
    }

    const emailHash = email
      ? createHash("sha256").update(email.toLowerCase().trim()).digest("hex")
      : undefined;

    const result = await addSupportVote(suggestionId, {
      emailHash,
      evidence: evidence ? String(evidence).slice(0, 1000) : undefined,
    });

    if (!result) {
      return apiError("NOT_FOUND", "Suggestion not found", 404);
    }

    if (result.alreadySupported) {
      return apiError("DUPLICATE_VOTE", "You have already supported this suggestion", 409);
    }

    // Check for community verification after support vote
    checkAndApplyCommunityVerification(suggestionId).catch((err) =>
      console.error("Community verification check failed:", err)
    );

    return apiSuccess({ supportCount: result.supportCount });
  } catch (err) {
    console.error("Support vote error:", err);
    return apiError("INTERNAL_ERROR", "Something went wrong", 500);
  }
}
