import { NextRequest, NextResponse } from "next/server";
import { getEntity, getEntityDimensionScores } from "@/lib/engine";

/**
 * GET /api/engine/domains/{domainId}/entities/{entityId}
 * Entity detail with all dimension scores.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string; entityId: string }> }
) {
  try {
    const { domainId, entityId } = await params;

    const entity = await getEntity(entityId);
    if (!entity || entity.domainId !== domainId) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Entity not found" },
        { status: 404 }
      );
    }

    const scores = await getEntityDimensionScores(entityId);

    return NextResponse.json({
      success: true,
      data: {
        ...entity,
        dimensionScores: scores.map((s) => ({
          dimensionId: s.dimensionId,
          dimensionName: s.dimensionName,
          score: Number(s.score),
          weight: Number(s.weight),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to get entity:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to get entity" },
      { status: 500 }
    );
  }
}
