import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { getToolChangelog } from "@/lib/db/queries";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const changelog = await getToolChangelog(slug);

    return apiSuccess(changelog);
  } catch (error) {
    console.error("GET /api/v1/tools/[slug]/changelog error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
