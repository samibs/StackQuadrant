import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { quadrantPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id: quadrantId } = await params;
    const body = await request.json();
    const { positions } = body as { positions: Array<{ toolId: string; xPosition: number; yPosition: number }> };

    if (!positions || !Array.isArray(positions)) {
      return apiError("VALIDATION_FAILED", "Positions array is required", 400);
    }

    // Replace all positions for this quadrant
    await db.delete(quadrantPositions).where(eq(quadrantPositions.quadrantId, quadrantId));

    if (positions.length > 0) {
      const values = positions.map((p) => ({
        quadrantId,
        toolId: p.toolId,
        xPosition: p.xPosition.toString(),
        yPosition: p.yPosition.toString(),
      }));
      await db.insert(quadrantPositions).values(values);
    }

    return apiSuccess({ updated: positions.length });
  } catch (error) {
    console.error("PUT /api/v1/admin/quadrants/[id]/positions error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
