import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { rawSignals } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getDomain } from "@/lib/engine";

/**
 * GET /api/engine/signals/{domainId}
 * Raw signal feed for a domain (admin only).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

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

    const conditions = [eq(rawSignals.domainId, domainId)];

    const sourceType = searchParams.get("sourceType");
    if (sourceType) {
      conditions.push(eq(rawSignals.sourceType, sourceType));
    }

    const processed = searchParams.get("processed");
    if (processed !== null) {
      conditions.push(eq(rawSignals.processed, processed === "true"));
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const signals = await db.select()
      .from(rawSignals)
      .where(and(...conditions))
      .orderBy(desc(rawSignals.ingestedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: signals,
      pagination: { limit, offset },
    });
  } catch (error) {
    console.error("Failed to get signals:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to get signals" },
      { status: 500 }
    );
  }
}
