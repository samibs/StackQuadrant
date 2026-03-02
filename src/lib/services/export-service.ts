// ============================================
// Export Service — CSV and JSON export for scan results
// ============================================

import { db } from "@/lib/db";
import { scans, painPoints, evidenceItems, solutionIdeas } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUserPlan } from "@/lib/services/billing-service";

interface ExportData {
  scan: {
    id: string;
    keywords: string[];
    sources: string[];
    timeframeDays: number;
    createdAt: string;
    completedAt: string | null;
  };
  painPoints: Array<{
    title: string;
    summary: string;
    severityScore: number;
    frequencyScore: number;
    intensityScore: number;
    marketSizeScore: number;
    competitionScore: number;
    wtpScore: number;
    trendDirection: string;
    sourceCount: number;
    audienceSummary: string | null;
    competitors: string[];
    evidenceCount: number;
    topQuotes: string[];
    sourceUrls: string[];
    solutionIdeas: string[];
  }>;
}

/**
 * Export scan results as CSV or JSON, enforcing plan limits.
 */
export async function exportScan(scanId: string, userId: string, format: "csv" | "json"): Promise<
  { success: true; data: string; contentType: string; filename: string } |
  { success: false; code: string; message: string }
> {
  const plan = await getUserPlan(userId);
  if (!plan.limits.exports) {
    return { success: false, code: "PLAN_LIMIT_REACHED", message: "Exports are not available on the Free plan. Upgrade to Starter or Pro." };
  }

  if (format === "json" && plan.code === "starter") {
    return { success: false, code: "PLAN_LIMIT_REACHED", message: "JSON export is only available on the Pro plan." };
  }

  // Get scan with ownership check
  const [scan] = await db.select().from(scans).where(and(eq(scans.id, scanId), eq(scans.userId, userId)));
  if (!scan) return { success: false, code: "NOT_FOUND", message: "Scan not found" };
  if (scan.status !== "completed") return { success: false, code: "VALIDATION_FAILED", message: "Can only export completed scans" };

  // Get pain points with evidence
  const points = await db.select().from(painPoints).where(eq(painPoints.scanId, scanId)).orderBy(desc(painPoints.severityScore));

  const exportData: ExportData = {
    scan: {
      id: scan.id,
      keywords: scan.targetKeywords as string[],
      sources: scan.enabledSources as string[],
      timeframeDays: scan.timeframeDays,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt?.toISOString() || null,
    },
    painPoints: await Promise.all(points.map(async (pp) => {
      const evidence = await db.select().from(evidenceItems).where(eq(evidenceItems.painPointId, pp.id)).orderBy(desc(evidenceItems.originalTimestamp));
      const ideas = await db.select().from(solutionIdeas).where(eq(solutionIdeas.painPointId, pp.id));

      // Limit evidence per plan
      const maxEvidence = plan.code === "pro" ? 20 : 5;
      const limitedEvidence = evidence.slice(0, maxEvidence);

      return {
        title: pp.title,
        summary: pp.summary,
        severityScore: pp.severityScore,
        frequencyScore: pp.frequencyScore,
        intensityScore: pp.intensityScore,
        marketSizeScore: pp.marketSizeScore,
        competitionScore: pp.competitionScore,
        wtpScore: pp.wtpScore,
        trendDirection: pp.trendDirection,
        sourceCount: pp.sourceCount,
        audienceSummary: pp.audienceSummary,
        competitors: (pp.competitorNames as string[]) || [],
        evidenceCount: evidence.length,
        topQuotes: limitedEvidence.map(e => e.quoteText.slice(0, 200)),
        sourceUrls: limitedEvidence.map(e => e.sourceUrl),
        solutionIdeas: ideas.map(i => i.title),
      };
    })),
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  if (format === "json") {
    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
      contentType: "application/json",
      filename: `paingaps-export-${timestamp}.json`,
    };
  }

  // CSV format
  const csvRows: string[] = [];
  csvRows.push([
    "Title", "Summary", "Severity", "Frequency", "Intensity",
    "Market Size", "Competition Gap", "Willingness to Pay", "Trend",
    "Source Count", "Audience", "Competitors", "Evidence Count",
    "Top Quote", "Source URL", "Solution Ideas",
  ].join(","));

  for (const pp of exportData.painPoints) {
    csvRows.push([
      csvEscape(pp.title),
      csvEscape(pp.summary),
      pp.severityScore,
      pp.frequencyScore,
      pp.intensityScore,
      pp.marketSizeScore,
      pp.competitionScore,
      pp.wtpScore,
      pp.trendDirection,
      pp.sourceCount,
      csvEscape(pp.audienceSummary || ""),
      csvEscape(pp.competitors.join("; ")),
      pp.evidenceCount,
      csvEscape(pp.topQuotes[0] || ""),
      csvEscape(pp.sourceUrls[0] || ""),
      csvEscape(pp.solutionIdeas.join("; ")),
    ].join(","));
  }

  return {
    success: true,
    data: csvRows.join("\n"),
    contentType: "text/csv",
    filename: `paingaps-export-${timestamp}.csv`,
  };
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
