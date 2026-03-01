import { NextRequest } from "next/server";
import { apiSuccess, apiError, parsePageParams } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { listChangeJobs } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, pageSize } = parsePageParams(searchParams);
    const status = searchParams.get("status") || undefined;

    const result = await listChangeJobs({ page, pageSize, status });

    return apiSuccess(result.changeJobs, { page, pageSize, total: result.total });
  } catch (error) {
    console.error("GET /api/v1/admin/change-jobs error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
