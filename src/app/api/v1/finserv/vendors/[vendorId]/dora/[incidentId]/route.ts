import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getTrackedVendor } from "@/lib/services/finserv-service";
import { requireTeamAccess } from "@/lib/services/team-service";
import { deleteVendorIncident } from "@/lib/services/finserv-dora-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; incidentId: string }> }
) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { vendorId, incidentId } = await params;
    const vendor = await getTrackedVendor(vendorId);
    if (!vendor) return apiError("NOT_FOUND", "Vendor not found", 404);

    const access = await requireTeamAccess(user.userId, vendor.teamId);
    if (!access || access.role !== "team_admin") {
      return apiError("FORBIDDEN", "Only team admins can delete incidents", 403);
    }

    // Tenant boundary is enforced again in the service predicate by vendorId + incidentId.
    const deleted = await deleteVendorIncident(vendorId, incidentId);
    if (!deleted) return apiError("NOT_FOUND", "Incident not found for this vendor", 404);

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/finserv/vendors/[vendorId]/dora/[incidentId] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
