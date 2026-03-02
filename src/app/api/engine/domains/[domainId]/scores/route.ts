import { NextRequest, NextResponse } from "next/server";
import { getEntityScoreHistory } from "@/lib/engine";

/**
 * GET /api/engine/domains/{domainId}/scores?entityId=xxx
 * Score history/trend data for an entity.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { domainId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId");

    if (!entityId) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", message: "entityId query parameter is required" },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
    const history = await getEntityScoreHistory(entityId, limit);

    return NextResponse.json({
      success: true,
      data: history.map((h) => ({
        compositeScore: Number(h.compositeScore),
        dimensionScores: h.dimensionScores,
        recordedAt: h.recordedAt,
      })),
    });
  } catch (error) {
    console.error("Failed to get score history:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to get score history" },
      { status: 500 }
    );
  }
}
