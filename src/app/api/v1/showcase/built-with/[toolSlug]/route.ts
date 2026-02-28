import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getShowcaseByTool } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ toolSlug: string }> }) {
  try {
    const { toolSlug } = await params;
    const data = await getShowcaseByTool(toolSlug);
    if (!data.tool) return apiError("NOT_FOUND", "Tool not found", 404);
    return apiSuccess(data);
  } catch (error) {
    console.error("GET /api/v1/showcase/built-with/[toolSlug] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
