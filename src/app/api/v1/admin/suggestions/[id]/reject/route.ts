import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getSuggestionById, updateSuggestionStatus, updateContributorOnStatusChange } from "@/lib/db/queries";
import { sendSuggestionNotification } from "@/lib/utils/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.reason || typeof body.reason !== "string" || body.reason.trim().length === 0) {
      return apiError("VALIDATION_ERROR", "Rejection reason is required", 400);
    }

    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      return apiError("NOT_FOUND", "Suggestion not found", 404);
    }

    if (suggestion.status !== "pending" && suggestion.status !== "needs_info") {
      return apiError(
        "INVALID_STATE_TRANSITION",
        `Cannot reject suggestion with status "${suggestion.status}". Must be "pending" or "needs_info".`,
        422
      );
    }

    const updated = await updateSuggestionStatus(id, {
      status: "rejected",
      rejectionReason: body.reason.trim(),
      reviewedBy: admin.email,
    });

    // Update contributor reputation + send notification
    if (suggestion.submitterEmail) {
      updateContributorOnStatusChange(suggestion.submitterEmail, "rejected").catch((err) =>
        console.error("Contributor update failed:", err)
      );
      sendSuggestionNotification(suggestion, "rejected", body.reason.trim()).catch((err) =>
        console.error("Notification failed:", err)
      );
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error("POST /api/v1/admin/suggestions/[id]/reject error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
