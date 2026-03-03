import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { getUserTeams, requireTeamAccess } from "@/lib/services/team-service";
import { generateReport } from "@/lib/services/finserv-report-service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) return apiError("FORBIDDEN", "No team membership found", 403);

    const teamId = userTeams[0].id;
    const access = await requireTeamAccess(user.userId, teamId);
    if (!access) return apiError("FORBIDDEN", "No team access", 403);

    const body = await request.json();
    const { reportType, format, sector, vendorId } = body;

    const validTypes = ["vendor_pains", "regulations", "sector_overview"];
    if (!validTypes.includes(reportType)) {
      return apiError("VALIDATION_FAILED", `reportType must be one of: ${validTypes.join(", ")}`, 400);
    }
    if (!["csv", "json"].includes(format)) {
      return apiError("VALIDATION_FAILED", "format must be 'csv' or 'json'", 400);
    }

    const result = await generateReport({ teamId, reportType, format, sector, vendorId });

    if (!result.success) {
      return apiError("PLAN_LIMIT_REACHED", result.error || "Report generation failed", 429);
    }

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": result.contentType!,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error("POST /api/v1/finserv/reports/generate error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
