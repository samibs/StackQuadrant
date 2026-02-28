import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getPublishedShowcaseProjects } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));
    const toolSlug = searchParams.get("tool") || undefined;

    const data = await getPublishedShowcaseProjects({ page, pageSize, toolSlug });
    return apiSuccess(data);
  } catch (error) {
    console.error("GET /api/v1/showcase error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
