import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { listRegulations, createRegulation } from "@/lib/services/finserv-service";
import { getUserTeams } from "@/lib/services/team-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const userTeams = await getUserTeams(user.userId);
    if (userTeams.length === 0) {
      return apiError("FORBIDDEN", "No team membership found", 403);
    }

    const { searchParams } = new URL(request.url);
    const issuingBody = searchParams.get("issuingBody") || undefined;
    const status = searchParams.get("status") || undefined;
    const jurisdiction = searchParams.get("jurisdiction") || undefined;

    const regs = await listRegulations({ issuingBody, status, jurisdiction });
    return apiSuccess({ regulations: regs });
  } catch (error) {
    console.error("GET /api/v1/finserv/regulations error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    // Only platform admins can create regulations
    if (user.role !== "admin") {
      return apiError("FORBIDDEN", "Only admins can create regulations", 403);
    }

    const body = await request.json();
    const { name, shortCode, issuingBody, jurisdictions, effectiveDate, implementationDeadline, status, summary, sourceUrl, impactMap, painScore } = body;

    if (!name || !shortCode || !issuingBody || !jurisdictions || !status || !summary || !sourceUrl) {
      return apiError("VALIDATION_FAILED", "Missing required fields: name, shortCode, issuingBody, jurisdictions, status, summary, sourceUrl", 400);
    }

    const reg = await createRegulation({
      name, shortCode, issuingBody, jurisdictions, effectiveDate, implementationDeadline, status, summary, sourceUrl, impactMap, painScore,
    });

    return apiSuccess(reg, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/finserv/regulations error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
