import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { sourceAdapterRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

/**
 * GET /api/v1/admin/engine/adapters/status
 * Get recent adapter run history for monitoring.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "50"),
      200
    );

    const runs = await db.select()
      .from(sourceAdapterRuns)
      .orderBy(desc(sourceAdapterRuns.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: runs.map((r) => ({
        id: r.id,
        adapterId: r.adapterId,
        domainId: r.domainId,
        status: r.status,
        signalsFetched: r.signalsFetched,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        errorMessage: r.errorMessage,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to get adapter status:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to get adapter status" },
      { status: 500 }
    );
  }
}
