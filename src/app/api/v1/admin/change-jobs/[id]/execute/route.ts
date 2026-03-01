import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getChangeJobById, updateChangeJobStatus, createToolChangelogEntry } from "@/lib/db/queries";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const changeJob = await getChangeJobById(id);

    if (!changeJob) {
      return apiError("NOT_FOUND", "Change job not found", 404);
    }

    if (changeJob.status !== "pending" && changeJob.status !== "failed") {
      return apiError(
        "INVALID_STATE_TRANSITION",
        `Cannot execute change job with status "${changeJob.status}". Must be "pending" or "failed".`,
        422
      );
    }

    const suggestion = changeJob.suggestion;
    const toolSlug = suggestion?.toolSlug || suggestion?.toolName?.toLowerCase().replace(/\s+/g, "-") || "unknown";

    const changeTypeMap: Record<string, string> = {
      insert: "added",
      update: changeJob.tableName === "quadrant_positions" ? "quadrant_move" : "metadata_update",
      delete: "discontinued",
    };
    const changeType = changeTypeMap[changeJob.operation] || "metadata_update";

    const payloadEntries = Object.entries(changeJob.payload as Record<string, { old?: unknown; new: unknown }>);
    const firstEntry = payloadEntries[0];
    const details: { field?: string; oldValue?: unknown; newValue?: unknown } = firstEntry
      ? { field: firstEntry[0], oldValue: firstEntry[1].old, newValue: firstEntry[1].new }
      : {};

    const summary = suggestion
      ? `${changeJob.operation} on ${changeJob.tableName}: ${suggestion.toolName} - ${suggestion.reason.slice(0, 200)}`
      : `${changeJob.operation} on ${changeJob.tableName}`;

    const changelog = await createToolChangelogEntry({
      toolSlug,
      changeType,
      summary,
      details,
      evidenceLinks: (suggestion?.evidenceLinks as string[]) || [],
      suggestedBy: suggestion?.submitterEmail || undefined,
      approvedBy: admin.email,
    });

    const updatedJob = await updateChangeJobStatus(id, {
      status: "executed",
      executedBy: admin.email,
      changelogEntryId: changelog.id,
    });

    return apiSuccess({ changeJob: updatedJob, changelog });
  } catch (error) {
    console.error("POST /api/v1/admin/change-jobs/[id]/execute error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
