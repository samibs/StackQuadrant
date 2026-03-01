import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getRegisteredSites, createRegisteredSite } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const sites = await getRegisteredSites();
    return apiSuccess(sites);
  } catch (error) {
    console.error("GET /api/v1/admin/sites error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const body = await request.json();

    if (!body.id || !body.name || !body.origin) {
      return apiError("VALIDATION_FAILED", "id, name, and origin are required", 400);
    }

    // Validate id format: lowercase alphanumeric + hyphens
    if (!/^[a-z0-9-]+$/.test(body.id)) {
      return apiError("VALIDATION_FAILED", "id must contain only lowercase letters, numbers, and hyphens", 400);
    }

    const site = await createRegisteredSite({
      id: body.id,
      name: body.name,
      origin: body.origin,
      mcpConfig: body.mcpConfig || {},
      active: body.active !== false,
    });

    return apiSuccess(site, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/admin/sites error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
