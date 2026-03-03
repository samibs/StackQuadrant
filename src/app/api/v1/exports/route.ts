import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { exportScan } from "@/lib/services/export-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const body = await request.json();
    const { scanId, format } = body;

    if (!scanId) return apiError("VALIDATION_FAILED", "scanId is required", 400);
    if (!["csv", "json"].includes(format)) return apiError("VALIDATION_FAILED", "format must be 'csv' or 'json'", 400);

    const result = await exportScan(scanId, user.userId, format);

    if (!result.success) {
      const status = result.code === "PLAN_LIMIT_REACHED" ? 429 : result.code === "NOT_FOUND" ? 404 : 400;
      return apiError(result.code, result.message, status);
    }

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error("POST /api/v1/exports error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
