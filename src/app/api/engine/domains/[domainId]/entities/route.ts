import { NextRequest, NextResponse } from "next/server";
import { listEntities, createEntity } from "@/lib/engine";
import { getDomain } from "@/lib/engine";

/**
 * GET /api/engine/domains/{domainId}/entities
 * List scored entities for a domain with filtering and pagination.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { domainId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const domain = await getDomain(domainId);
    if (!domain) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Domain not found" },
        { status: 404 }
      );
    }

    const result = await listEntities({
      domainId,
      entityType: searchParams.get("entityType") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sortBy: (searchParams.get("sortBy") as "name" | "compositeScore" | "createdAt" | "updatedAt") ?? "compositeScore",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
      limit: Math.min(parseInt(searchParams.get("limit") ?? "50"), 100),
      offset: parseInt(searchParams.get("offset") ?? "0"),
    });

    return NextResponse.json({
      success: true,
      data: result.entities,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    console.error("Failed to list entities:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to list entities" },
      { status: 500 }
    );
  }
}
