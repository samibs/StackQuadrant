// ============================================
// FinServ Report Service — Generate CSV/JSON reports for teams
// White-label export with team branding
// ============================================

import { db } from "@/lib/db";
import { vendorPains, trackedVendors, regulations, teams } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface ReportOptions {
  teamId: string;
  reportType: "vendor_pains" | "regulations" | "sector_overview";
  format: "csv" | "json";
  sector?: string;
  vendorId?: string;
}

export async function generateReport(options: ReportOptions): Promise<{
  success: boolean;
  data?: string;
  contentType?: string;
  filename?: string;
  error?: string;
}> {
  const [team] = await db.select().from(teams).where(eq(teams.id, options.teamId));
  if (!team) return { success: false, error: "Team not found" };

  // Business and Enterprise plans only
  const allowedPlans = ["business", "enterprise"];
  if (!allowedPlans.includes(team.planCode)) {
    return { success: false, error: "Report generation requires Business or Enterprise plan" };
  }

  let reportData: Record<string, unknown>[] = [];
  let reportName = "report";

  switch (options.reportType) {
    case "vendor_pains": {
      const conditions = [eq(trackedVendors.teamId, options.teamId)];
      if (options.vendorId) {
        conditions.push(eq(trackedVendors.id, options.vendorId));
      }

      const pains = await db
        .select({
          vendorName: trackedVendors.vendorName,
          sector: trackedVendors.sector,
          painTitle: vendorPains.title,
          painSummary: vendorPains.summary,
          intensityScore: vendorPains.intensityScore,
          frequencyScore: vendorPains.frequencyScore,
          trendDirection: vendorPains.trendDirection,
          fixDetected: vendorPains.fixDetected,
          evidenceCount: vendorPains.evidenceCount,
          firstSeenAt: vendorPains.firstSeenAt,
        })
        .from(vendorPains)
        .innerJoin(trackedVendors, eq(trackedVendors.id, vendorPains.trackedVendorId))
        .where(and(...conditions))
        .orderBy(desc(vendorPains.intensityScore));

      reportData = pains;
      reportName = "vendor-pain-report";
      break;
    }

    case "regulations": {
      const regs = await db
        .select({
          name: regulations.name,
          shortCode: regulations.shortCode,
          issuingBody: regulations.issuingBody,
          jurisdictions: regulations.jurisdictions,
          status: regulations.status,
          effectiveDate: regulations.effectiveDate,
          implementationDeadline: regulations.implementationDeadline,
          painScore: regulations.painScore,
          summary: regulations.summary,
        })
        .from(regulations)
        .orderBy(desc(regulations.painScore));

      reportData = regs;
      reportName = "regulatory-radar-report";
      break;
    }

    case "sector_overview": {
      const sector = options.sector || "fund";
      const pains = await db
        .select({
          vendorName: trackedVendors.vendorName,
          painTitle: vendorPains.title,
          intensityScore: vendorPains.intensityScore,
          frequencyScore: vendorPains.frequencyScore,
          trendDirection: vendorPains.trendDirection,
          evidenceCount: vendorPains.evidenceCount,
        })
        .from(vendorPains)
        .innerJoin(trackedVendors, eq(trackedVendors.id, vendorPains.trackedVendorId))
        .where(and(eq(trackedVendors.teamId, options.teamId), eq(trackedVendors.sector, sector)))
        .orderBy(desc(vendorPains.intensityScore));

      reportData = pains;
      reportName = `sector-${sector}-report`;
      break;
    }
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${reportName}-${timestamp}.${options.format}`;

  if (options.format === "json") {
    return {
      success: true,
      data: JSON.stringify({ team: team.name, generatedAt: new Date().toISOString(), data: reportData }, null, 2),
      contentType: "application/json",
      filename,
    };
  }

  // CSV format
  if (reportData.length === 0) {
    return { success: true, data: "", contentType: "text/csv", filename };
  }

  const headers = Object.keys(reportData[0]);
  const csvLines = [headers.join(",")];

  for (const row of reportData) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    });
    csvLines.push(values.join(","));
  }

  return {
    success: true,
    data: csvLines.join("\n"),
    contentType: "text/csv",
    filename,
  };
}
