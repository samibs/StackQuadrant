import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { listEsaReports, recordEsaReport } from "@/lib/services/finserv-dora-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const reports = await listEsaReports();
    return apiSuccess({ reports });
  } catch (error) {
    console.error("GET /api/v1/finserv/dora/reports error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
    if (user.role !== "admin") return apiError("FORBIDDEN", "Only admins can record ESA reports", 403);

    const body = await request.json();
    const {
      reportTitle,
      reportDate,
      reportPeriodStart,
      reportPeriodEnd,
      sourceUrl,
      summary,
      categoryDistribution,
      totalIncidents,
    } = body;

    if (!reportTitle || !reportDate || !sourceUrl || !summary) {
      return apiError(
        "VALIDATION_FAILED",
        "reportTitle, reportDate, sourceUrl, summary are required",
        400
      );
    }

    if (typeof sourceUrl !== "string" || !/^https?:\/\//.test(sourceUrl)) {
      return apiError("VALIDATION_FAILED", "sourceUrl must be an http(s) URL", 400);
    }

    const report = await recordEsaReport({
      reportTitle,
      reportDate,
      reportPeriodStart,
      reportPeriodEnd,
      sourceUrl,
      summary,
      categoryDistribution,
      totalIncidents,
    });

    return apiSuccess(report, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/dora/reports error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
