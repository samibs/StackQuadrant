import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getSuggestionById, updateSuggestionStatus, createChangeJob, updateContributorOnStatusChange } from "@/lib/db/queries";
import { sendSuggestionNotification } from "@/lib/utils/notifications";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      return apiError("NOT_FOUND", "Suggestion not found", 404);
    }

    if (suggestion.status !== "pending" && suggestion.status !== "needs_info") {
      return apiError(
        "INVALID_STATE_TRANSITION",
        `Cannot approve suggestion with status "${suggestion.status}". Must be "pending" or "needs_info".`,
        422
      );
    }

    const updated = await updateSuggestionStatus(id, {
      status: "approved",
      adminNotes: body.adminNotes || undefined,
      reviewedBy: admin.email,
    });

    let changeJobPayload: {
      tableName: string;
      operation: string;
      payload: Record<string, { old?: unknown; new: unknown }>;
    };

    switch (suggestion.type) {
      case "add_tool":
        changeJobPayload = {
          tableName: "tools",
          operation: "insert",
          payload: {
            name: { new: suggestion.toolName },
            slug: { new: slugify(suggestion.toolName) },
          },
        };
        break;

      case "move_tool":
        changeJobPayload = {
          tableName: "quadrant_positions",
          operation: "update",
          payload: {
            quadrant: { old: "unknown", new: suggestion.proposedQuadrant },
          },
        };
        break;

      case "update_metadata":
        changeJobPayload = {
          tableName: "tools",
          operation: "update",
          payload: suggestion.context as Record<string, { old?: unknown; new: unknown }>,
        };
        break;

      case "merge_duplicates":
        changeJobPayload = {
          tableName: "tools",
          operation: "update",
          payload: {
            merge: { new: suggestion.toolName },
          },
        };
        break;

      case "flag_discontinued":
        changeJobPayload = {
          tableName: "tools",
          operation: "update",
          payload: {
            status: { old: "published", new: "archived" },
          },
        };
        break;

      default:
        changeJobPayload = {
          tableName: "tools",
          operation: "update",
          payload: {
            note: { new: suggestion.reason },
          },
        };
    }

    const changeJob = await createChangeJob({
      suggestionId: id,
      tableName: changeJobPayload.tableName,
      operation: changeJobPayload.operation,
      payload: changeJobPayload.payload,
    });

    // Update contributor reputation + send notification
    if (suggestion.submitterEmail) {
      updateContributorOnStatusChange(suggestion.submitterEmail, "approved").catch((err) =>
        console.error("Contributor update failed:", err)
      );
      sendSuggestionNotification(suggestion, "approved").catch((err) =>
        console.error("Notification failed:", err)
      );
    }

    return apiSuccess({ suggestion: updated, changeJob });
  } catch (error) {
    console.error("POST /api/v1/admin/suggestions/[id]/approve error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
