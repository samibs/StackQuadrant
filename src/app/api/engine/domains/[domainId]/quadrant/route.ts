import { NextRequest, NextResponse } from "next/server";
import { getDomain, getQuadrantEntities } from "@/lib/engine";
import type { DomainConfig } from "@/lib/engine/types";

/**
 * GET /api/engine/domains/{domainId}/quadrant
 * Quadrant visualization data for a domain.
 * Returns entities with x/y positions and the quadrant configuration.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { domainId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") ?? undefined;

    const domain = await getDomain(domainId);
    if (!domain) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Domain not found" },
        { status: 404 }
      );
    }

    const config = domain.config as unknown as DomainConfig;
    const entities = await getQuadrantEntities(domainId, entityType);

    return NextResponse.json({
      success: true,
      data: {
        quadrantConfig: config.quadrantConfig,
        entities,
        entityCount: entities.length,
      },
    });
  } catch (error) {
    console.error("Failed to get quadrant data:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to get quadrant data" },
      { status: 500 }
    );
  }
}
