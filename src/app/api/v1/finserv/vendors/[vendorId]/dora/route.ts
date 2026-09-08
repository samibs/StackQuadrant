import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getTrackedVendor } from "@/lib/services/finserv-service";
import { requireTeamAccess } from "@/lib/services/team-service";
import { getVendorDoraSummary, addVendorIncident } from "@/lib/services/finserv-dora-service";

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { vendorId } = await params;
    const vendor = await getTrackedVendor(vendorId);
    if (!vendor) return apiError("NOT_FOUND", "Vendor not found", 404);

    const access = await requireTeamAccess(user.userId, vendor.teamId);
    if (!access) return apiError("FORBIDDEN", "No access to this vendor", 403);

    return apiSuccess(await getVendorDoraSummary(vendorId));
  } catch (error) {
    console.error("GET /api/v1/finserv/vendors/[vendorId]/dora error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { vendorId } = await params;
    const vendor = await getTrackedVendor(vendorId);
    if (!vendor) return apiError("NOT_FOUND", "Vendor not found", 404);

    const access = await requireTeamAccess(user.userId, vendor.teamId);
    if (!access || access.role !== "team_admin") {
      return apiError("FORBIDDEN", "Only team admins can record incidents", 403);
    }

    const body = await request.json();
    const { categoryId, title, description, severity, occurredAt, resolvedAt, disclosureUrl, esaReportId } = body;

    if (typeof categoryId !== "string" || !categoryId.trim()) {
      return apiError("VALIDATION_FAILED", "categoryId is required", 400);
    }
    if (typeof title !== "string" || !title.trim() || title.trim().length > 240) {
      return apiError("VALIDATION_FAILED", "title must contain 1-240 characters", 400);
    }
    if (typeof description !== "string" || !description.trim()) {
      return apiError("VALIDATION_FAILED", "description is required", 400);
    }

    const severityNum = Number(severity);
    if (!Number.isInteger(severityNum) || severityNum < 1 || severityNum > 5) {
      return apiError("VALIDATION_FAILED", "severity must be an integer 1-5", 400);
    }

    if (typeof occurredAt !== "string" || Number.isNaN(new Date(occurredAt).getTime())) {
      return apiError("VALIDATION_FAILED", "occurredAt must be a valid timestamp", 400);
    }
    if (new Date(occurredAt).getTime() > Date.now() + 5 * 60 * 1000) {
      return apiError("VALIDATION_FAILED", "occurredAt cannot be in the future", 400);
    }
    if (resolvedAt && (typeof resolvedAt !== "string" || Number.isNaN(new Date(resolvedAt).getTime()))) {
      return apiError("VALIDATION_FAILED", "resolvedAt must be a valid timestamp", 400);
    }
    if (resolvedAt && new Date(resolvedAt) < new Date(occurredAt)) {
      return apiError("VALIDATION_FAILED", "resolvedAt cannot precede occurredAt", 400);
    }

    if (disclosureUrl && !isHttpUrl(disclosureUrl)) {
      return apiError("VALIDATION_FAILED", "disclosureUrl must be an http(s) URL", 400);
    }
    if (esaReportId && typeof esaReportId !== "string") {
      return apiError("VALIDATION_FAILED", "esaReportId must be a string UUID", 400);
    }

    const result = await addVendorIncident(vendorId, {
      categoryId: categoryId.trim(),
      title: title.trim(),
      description: description.trim(),
      severity: severityNum,
      occurredAt,
      resolvedAt: resolvedAt || undefined,
      disclosureUrl: disclosureUrl || undefined,
      esaReportId: esaReportId || undefined,
      reportedBy: user.email,
    });

    if (!result.success) {
      const status = result.code === "NOT_FOUND" ? 404 : 400;
      return apiError(result.code, result.message, status);
    }

    return apiSuccess(result.incident, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/vendors/[vendorId]/dora error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
