import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getVendorDetail, removeTrackedVendor, getTrackedVendor } from "@/lib/services/finserv-service";
import { getUserTeams, requireTeamAccess } from "@/lib/services/team-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { vendorId } = await params;
    const detail = await getVendorDetail(vendorId);
    if (!detail) return apiError("NOT_FOUND", "Vendor not found", 404);

    // Verify team access
    const access = await requireTeamAccess(user.userId, detail.teamId);
    if (!access) return apiError("FORBIDDEN", "No access to this vendor", 403);

    return apiSuccess(detail);
  } catch (error) {
    console.error("GET /api/v1/finserv/vendors/[vendorId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { vendorId } = await params;
    const vendor = await getTrackedVendor(vendorId);
    if (!vendor) return apiError("NOT_FOUND", "Vendor not found", 404);

    const access = await requireTeamAccess(user.userId, vendor.teamId);
    if (!access || access.role !== "team_admin") {
      return apiError("FORBIDDEN", "Only team admins can remove vendors", 403);
    }

    await removeTrackedVendor(vendorId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/finserv/vendors/[vendorId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
