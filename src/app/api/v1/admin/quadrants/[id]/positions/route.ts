import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { quadrantPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id: quadrantId } = await params;
    const body = await request.json();
    const { positions } = body as { positions: unknown };

    if (!positions || !Array.isArray(positions)) {
      return apiError("VALIDATION_FAILED", "Positions array is required", 400);
    }

    if (positions.length > 100) {
      return apiError("VALIDATION_FAILED", "Maximum 100 positions allowed", 400);
    }

    const errors: Array<{ field: string; message: string }> = [];
    const seenToolIds = new Set<string>();

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (!p || typeof p !== "object") {
        errors.push({ field: `positions[${i}]`, message: "Must be an object" });
        continue;
      }
      if (typeof p.toolId !== "string" || !UUID_RE.test(p.toolId)) {
        errors.push({ field: `positions[${i}].toolId`, message: "Must be a valid UUID" });
      } else if (seenToolIds.has(p.toolId)) {
        errors.push({ field: `positions[${i}].toolId`, message: "Duplicate toolId" });
      } else {
        seenToolIds.add(p.toolId);
      }
      if (typeof p.xPosition !== "number" || !isFinite(p.xPosition) || p.xPosition < 0 || p.xPosition > 100) {
        errors.push({ field: `positions[${i}].xPosition`, message: "Must be a number between 0 and 100" });
      }
      if (typeof p.yPosition !== "number" || !isFinite(p.yPosition) || p.yPosition < 0 || p.yPosition > 100) {
        errors.push({ field: `positions[${i}].yPosition`, message: "Must be a number between 0 and 100" });
      }
    }

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid position data", 400, errors);
    }

    // Replace all positions for this quadrant
    await db.delete(quadrantPositions).where(eq(quadrantPositions.quadrantId, quadrantId));

    if (positions.length > 0) {
      const values = positions.map((p: { toolId: string; xPosition: number; yPosition: number }) => ({
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
