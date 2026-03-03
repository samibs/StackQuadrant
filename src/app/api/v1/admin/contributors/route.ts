import { NextRequest } from "next/server";
import { apiSuccess, apiError, parsePageParams } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { listContributors } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, pageSize } = parsePageParams(searchParams);
    const sort = searchParams.get("sort") || undefined;

    const result = await listContributors({ page, pageSize, sort });

    return apiSuccess(result.data, { page, pageSize, total: result.total });
  } catch (error) {
    console.error("GET /api/v1/admin/contributors error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
