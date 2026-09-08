import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { listEsaReports, recordEsaReport } from "@/lib/services/finserv-dora-service";

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isCategoryDistribution(value: unknown): value is Record<string, number> {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, count]) =>
    key.length > 0 && typeof count === "number" && Number.isFinite(count) && count >= 0
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);
    return apiSuccess({ reports: await listEsaReports() });
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

    if (typeof reportTitle !== "string" || !reportTitle.trim() || reportTitle.trim().length > 300) {
      return apiError("VALIDATION_FAILED", "reportTitle must contain 1-300 characters", 400);
    }
    if (!isIsoDate(reportDate)) {
      return apiError("VALIDATION_FAILED", "reportDate must be YYYY-MM-DD", 400);
    }
    if (reportPeriodStart && !isIsoDate(reportPeriodStart)) {
      return apiError("VALIDATION_FAILED", "reportPeriodStart must be YYYY-MM-DD", 400);
    }
    if (reportPeriodEnd && !isIsoDate(reportPeriodEnd)) {
      return apiError("VALIDATION_FAILED", "reportPeriodEnd must be YYYY-MM-DD", 400);
    }
    if (reportPeriodStart && reportPeriodEnd && reportPeriodStart > reportPeriodEnd) {
      return apiError("VALIDATION_FAILED", "reportPeriodStart cannot be after reportPeriodEnd", 400);
    }
    if (!isHttpUrl(sourceUrl)) {
      return apiError("VALIDATION_FAILED", "sourceUrl must be an http(s) URL", 400);
    }
    if (typeof summary !== "string" || !summary.trim()) {
      return apiError("VALIDATION_FAILED", "summary is required", 400);
    }
    if (!isCategoryDistribution(categoryDistribution)) {
      return apiError("VALIDATION_FAILED", "categoryDistribution must contain non-negative numeric values", 400);
    }
    if (totalIncidents !== undefined && (!Number.isInteger(totalIncidents) || totalIncidents < 0)) {
      return apiError("VALIDATION_FAILED", "totalIncidents must be a non-negative integer", 400);
    }

    const report = await recordEsaReport({
      reportTitle: reportTitle.trim(),
      reportDate,
      reportPeriodStart: reportPeriodStart || undefined,
      reportPeriodEnd: reportPeriodEnd || undefined,
      sourceUrl,
      summary: summary.trim(),
      categoryDistribution,
      totalIncidents,
    });

    return apiSuccess(report, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/dora/reports error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
