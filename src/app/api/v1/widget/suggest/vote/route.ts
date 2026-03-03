import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { castSuggestionVote, getSuggestionVoteCounts, getUserVoteOnSuggestion } from "@/lib/db/queries";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`widget:vote:${ip}`, 30, 3600000);
    if (!rl.success) {
      return apiError("RATE_LIMITED", "Too many votes. Please try again later.", 429);
    }

    const body = await request.json();
    const { suggestionId, vote } = body;

    if (!suggestionId || typeof suggestionId !== "string") {
      return apiError("VALIDATION_FAILED", "suggestionId is required", 400);
    }
    if (vote !== "up" && vote !== "down") {
      return apiError("VALIDATION_FAILED", "vote must be 'up' or 'down'", 400);
    }

    const ipHash = createHash("sha256").update(ip).digest("hex");
    const result = await castSuggestionVote(suggestionId, vote, ipHash);

    if (result.alreadyVoted) {
      return apiSuccess({ alreadyVoted: true, vote: result.vote });
    }

    return apiSuccess({ netScore: result.netScore, changed: result.changed || false });
  } catch (error) {
    console.error("POST /api/v1/widget/suggest/vote error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const suggestionId = request.nextUrl.searchParams.get("suggestionId");
    if (!suggestionId) {
      return apiError("VALIDATION_FAILED", "suggestionId is required", 400);
    }

    const counts = await getSuggestionVoteCounts(suggestionId);

    const ip = getClientIp(request);
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const userVote = await getUserVoteOnSuggestion(suggestionId, ipHash);

    return apiSuccess({ ...counts, userVoted: userVote });
  } catch (error) {
    console.error("GET /api/v1/widget/suggest/vote error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
