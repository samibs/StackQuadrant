import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getScan, getScanPainPoints, deleteScan } from "@/lib/services/scan-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { scanId } = await params;
    const scan = await getScan(scanId, user.userId);
    if (!scan) return apiError("NOT_FOUND", "Scan not found", 404);

    const painPointsList = await getScanPainPoints(scanId, user.userId);

    return apiSuccess({ scan, painPoints: painPointsList || [] });
  } catch (error) {
    console.error("GET /api/v1/scans/[scanId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { scanId } = await params;
    const deleted = await deleteScan(scanId, user.userId);
    if (!deleted) return apiError("NOT_FOUND", "Scan not found", 404);

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/scans/[scanId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
