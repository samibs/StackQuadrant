import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getEsaReport } from "@/lib/services/finserv-dora-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { reportId } = await params;
    const report = await getEsaReport(reportId);
    if (!report) return apiError("NOT_FOUND", "ESA report not found", 404);

    return apiSuccess(report);
  } catch (error) {
    console.error("GET /api/v1/finserv/dora/reports/[reportId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
