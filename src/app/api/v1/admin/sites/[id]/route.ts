import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getRegisteredSite, updateRegisteredSite, deleteRegisteredSite } from "@/lib/db/queries";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const site = await getRegisteredSite(id);
    if (!site) return apiError("NOT_FOUND", "Site not found", 404);
    return apiSuccess(site);
  } catch (error) {
    console.error("GET /api/v1/admin/sites/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getRegisteredSite(id);
    if (!existing) return apiError("NOT_FOUND", "Site not found", 404);

    const updated = await updateRegisteredSite(id, {
      name: body.name,
      origin: body.origin,
      mcpConfig: body.mcpConfig,
      active: body.active,
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("PUT /api/v1/admin/sites/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;

    // Prevent deleting the primary site
    if (id === "stackquadrant") {
      return apiError("FORBIDDEN", "Cannot delete the primary site", 403);
    }

    const existing = await getRegisteredSite(id);
    if (!existing) return apiError("NOT_FOUND", "Site not found", 404);

    await deleteRegisteredSite(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/v1/admin/sites/[id] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
