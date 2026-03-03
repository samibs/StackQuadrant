import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { db } from "@/lib/db";
import { painPoints, scans } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

/**
 * Public preview: show 3 sample pain points for a market keyword.
 * No authentication required.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ market: string }> }) {
  try {
    const { market } = await params;
    const decoded = decodeURIComponent(market).toLowerCase().trim();

    if (!decoded || decoded.length < 2) {
      return apiError("VALIDATION_FAILED", "Market keyword must be at least 2 characters", 400);
    }

    // Find completed scans that match this market keyword
    const matchingScans = await db
      .select({ id: scans.id })
      .from(scans)
      .where(and(
        eq(scans.status, "completed"),
        sql`${scans.targetKeywords}::text ILIKE ${`%${decoded}%`}`
      ))
      .limit(10);

    if (matchingScans.length === 0) {
      return apiSuccess({
        market: decoded,
        painPoints: [],
        message: "No data available for this market yet. Sign up to run your own scan.",
      });
    }

    const scanIds = matchingScans.map(s => s.id);

    // Get top 3 pain points across matching scans (redacted for preview)
    const preview = await db
      .select({
        title: painPoints.title,
        severityScore: painPoints.severityScore,
        trendDirection: painPoints.trendDirection,
        marketSizeScore: painPoints.marketSizeScore,
        sourceCount: painPoints.sourceCount,
      })
      .from(painPoints)
      .where(sql`${painPoints.scanId} IN (${sql.join(scanIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(painPoints.severityScore))
      .limit(3);

    return apiSuccess({
      market: decoded,
      painPoints: preview.map(pp => ({
        title: pp.title,
        severityScore: pp.severityScore,
        trendDirection: pp.trendDirection,
        marketSizeScore: pp.marketSizeScore,
        sourceCount: pp.sourceCount,
        // Redacted: no summary, no evidence, no ideas
      })),
      message: preview.length > 0
        ? "Sign up to see full details, evidence, and AI solution ideas."
        : "No pain points found for this market. Sign up to run a fresh scan.",
    });
  } catch (error) {
    console.error("GET /api/v1/public/preview/[market] error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
