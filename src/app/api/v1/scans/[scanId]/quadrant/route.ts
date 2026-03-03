import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireUser } from "@/lib/auth/user-auth";
import { db } from "@/lib/db";
import { scans, painPoints } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return apiError("UNAUTHORIZED", "Not authenticated", 401);

    const { scanId } = await params;

    // Verify ownership
    const [scan] = await db.select().from(scans).where(and(eq(scans.id, scanId), eq(scans.userId, user.userId)));
    if (!scan) return apiError("NOT_FOUND", "Scan not found", 404);

    // Get pain points for quadrant plotting
    const points = await db.select().from(painPoints).where(eq(painPoints.scanId, scanId)).orderBy(desc(painPoints.severityScore));

    // Map pain points to quadrant entities:
    // X-Axis: Competition Density (competitionScore inverted: 100 - score, since high score = low competition = good)
    // Y-Axis: Market Size (marketSizeScore)
    // Color: Pain Intensity (severityScore)
    // Size: Source count (cross-source validation)
    const entities = points.map(pp => ({
      id: pp.id,
      label: pp.title,
      x: 100 - pp.competitionScore, // Invert: high competition = right side
      y: pp.marketSizeScore,
      colorValue: pp.severityScore,
      sizeValue: Math.min(pp.sourceCount * 20, 100),
      subtitle: `Severity: ${pp.severityScore} | ${pp.trendDirection}`,
      scores: {
        severity: pp.severityScore,
        frequency: pp.frequencyScore,
        intensity: pp.intensityScore,
        marketSize: pp.marketSizeScore,
        competition: pp.competitionScore,
        wtp: pp.wtpScore,
      },
      metadata: {
        trendDirection: pp.trendDirection,
        sourceCount: pp.sourceCount,
        audienceSummary: pp.audienceSummary,
      },
    }));

    const quadrantConfig = {
      xAxisLabel: "Competition Density",
      yAxisLabel: "Market Size",
      quadrants: {
        topLeft: "Gold Mine",
        topRight: "Red Ocean",
        bottomLeft: "Hidden Gem",
        bottomRight: "Crowded Niche",
      },
    };

    return apiSuccess({ entities, config: quadrantConfig, scanId: scan.id, status: scan.status });
  } catch (error) {
    console.error("GET /api/v1/scans/[scanId]/quadrant error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
