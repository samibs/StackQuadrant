import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getTrackedVendor } from "@/lib/services/finserv-service";
import { requireTeamAccess } from "@/lib/services/team-service";
import {
  getVendorDoraSummary,
  addVendorIncident,
} from "@/lib/services/finserv-dora-service";

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

    const summary = await getVendorDoraSummary(vendorId);
    return apiSuccess(summary);
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

    if (!categoryId || !title || !description || severity == null || !occurredAt) {
      return apiError(
        "VALIDATION_FAILED",
        "categoryId, title, description, severity, occurredAt are required",
        400
      );
    }

    const severityNum = Number(severity);
    if (!Number.isInteger(severityNum) || severityNum < 1 || severityNum > 5) {
      return apiError("VALIDATION_FAILED", "severity must be an integer 1-5", 400);
    }

    if (disclosureUrl && (typeof disclosureUrl !== "string" || !/^https?:\/\//.test(disclosureUrl))) {
      return apiError("VALIDATION_FAILED", "disclosureUrl must be an http(s) URL", 400);
    }

    const result = await addVendorIncident(vendorId, {
      categoryId,
      title,
      description,
      severity: severityNum,
      occurredAt,
      resolvedAt,
      disclosureUrl,
      esaReportId,
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
