import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getReportById, updateReport } from "@/lib/db/queries";

const VALID_STATUSES = ["new", "investigating", "fixed", "closed", "wont_fix"];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const report = await getReportById(id);

    if (!report) {
      return apiError("NOT_FOUND", "Report not found", 404);
    }

    return apiSuccess(report);
  } catch (error) {
    console.error("GET /api/v1/admin/reports/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getReportById(id);
    if (!existing) {
      return apiError("NOT_FOUND", "Report not found", 404);
    }

    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return apiError(
        "VALIDATION_ERROR",
        `Invalid status "${body.status}". Must be one of: ${VALID_STATUSES.join(", ")}`,
        400
      );
    }

    const updated = await updateReport(id, {
      status: body.status,
      adminNotes: body.adminNotes,
      reviewedBy: admin.email,
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/reports/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
