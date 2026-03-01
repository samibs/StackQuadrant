import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { findDuplicateSuggestions } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success: rateLimitOk } = rateLimit(`widget:dupcheck:${ip}`, 20, 3600000);
    if (!rateLimitOk) {
      return apiError("RATE_LIMITED", "Too many requests. Try again later.", 429);
    }

    const { searchParams } = new URL(request.url);
    const toolName = searchParams.get("toolName");
    const type = searchParams.get("type");
    const toolSlug = searchParams.get("toolSlug") || undefined;

    if (!toolName || !type) {
      return apiError("VALIDATION_FAILED", "toolName and type are required", 400);
    }

    const duplicates = await findDuplicateSuggestions(toolName, type, toolSlug);

    return apiSuccess({
      duplicate: duplicates.length > 0,
      existing: duplicates.length > 0 ? duplicates[0] : null,
      similar: duplicates,
    });
  } catch (err) {
    console.error("Duplicate check error:", err);
    return apiError("INTERNAL_ERROR", "Something went wrong", 500);
  }
}
