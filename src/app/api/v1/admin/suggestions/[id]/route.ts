import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getSuggestionById, getSimilarSuggestions, getContributorByEmail } from "@/lib/db/queries";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const suggestion = await getSuggestionById(id);

    if (!suggestion) {
      return apiError("NOT_FOUND", "Suggestion not found", 404);
    }

    const similarSuggestions = suggestion.toolSlug
      ? await getSimilarSuggestions(suggestion.toolSlug, suggestion.type)
      : [];

    const contributor = suggestion.submitterEmail
      ? await getContributorByEmail(suggestion.submitterEmail)
      : null;

    return apiSuccess({ suggestion, similarSuggestions, contributor });
  } catch (error) {
    console.error("GET /api/v1/admin/suggestions/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
