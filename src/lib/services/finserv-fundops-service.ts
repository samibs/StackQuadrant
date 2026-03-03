// ============================================
// FinServ Fund Operations Intelligence Service
// Fund industry operational pain monitoring
// ============================================

import { db } from "@/lib/db";
import { vendorPains, trackedVendors } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Fund operations areas
const OPS_AREAS = {
  nav: { name: "NAV Calculation", keywords: ["nav", "net asset value", "pricing", "valuation"] },
  ta: { name: "Transfer Agency", keywords: ["transfer agent", "investor onboarding", "subscription", "redemption", "kyc"] },
  reporting: { name: "Reporting", keywords: ["sfdr", "priips", "kiid", "annual report", "investor report", "regulatory report"] },
  kyc: { name: "KYC / AML", keywords: ["kyc", "aml", "know your customer", "anti-money laundering", "cdd", "due diligence"] },
  investor_comms: { name: "Investor Communications", keywords: ["investor portal", "investor communication", "distribution notice", "statement"] },
  reconciliation: { name: "Reconciliation", keywords: ["reconciliation", "reconciling", "breaks", "cash recon", "position recon"] },
};

export interface FundOpsPainIndex {
  area: string;
  areaName: string;
  painCount: number;
  avgIntensity: number;
  topPain: { title: string; intensityScore: number; trendDirection: string } | null;
  trend: string; // overall trend for this area
}

export async function getFundOpsIndex(teamId: string) {
  // Get all fund industry pains
  const pains = await db
    .select({
      id: vendorPains.id,
      title: vendorPains.title,
      summary: vendorPains.summary,
      intensityScore: vendorPains.intensityScore,
      frequencyScore: vendorPains.frequencyScore,
      trendDirection: vendorPains.trendDirection,
      evidenceCount: vendorPains.evidenceCount,
      vendorName: trackedVendors.vendorName,
    })
    .from(vendorPains)
    .innerJoin(trackedVendors, eq(trackedVendors.id, vendorPains.trackedVendorId))
    .where(and(eq(trackedVendors.teamId, teamId), eq(trackedVendors.sector, "fund")))
    .orderBy(desc(vendorPains.intensityScore));

  // Build pain index per ops area
  const index: FundOpsPainIndex[] = Object.entries(OPS_AREAS).map(([areaId, area]) => {
    const areaPains = pains.filter((p) => {
      const text = (p.title + " " + p.summary).toLowerCase();
      return area.keywords.some((kw) => text.includes(kw));
    });

    const avgIntensity = areaPains.length > 0
      ? Math.round(areaPains.reduce((sum, p) => sum + p.intensityScore, 0) / areaPains.length)
      : 0;

    const growingCount = areaPains.filter((p) => p.trendDirection === "growing").length;
    const decliningCount = areaPains.filter((p) => p.trendDirection === "declining").length;
    const overallTrend = growingCount > decliningCount ? "growing" : decliningCount > growingCount ? "declining" : "stable";

    return {
      area: areaId,
      areaName: area.name,
      painCount: areaPains.length,
      avgIntensity,
      topPain: areaPains[0] ? { title: areaPains[0].title, intensityScore: areaPains[0].intensityScore, trendDirection: areaPains[0].trendDirection } : null,
      trend: overallTrend,
    };
  });

  return { index, totalPains: pains.length };
}

export async function getProviderComparison(teamId: string, vendorIds: string[]) {
  // Get pain profiles for selected providers
  const profiles = [];

  for (const vendorId of vendorIds.slice(0, 5)) {
    const vendor = await db.select().from(trackedVendors).where(and(eq(trackedVendors.id, vendorId), eq(trackedVendors.teamId, teamId))).then(r => r[0]);
    if (!vendor) continue;

    const pains = await db
      .select()
      .from(vendorPains)
      .where(eq(vendorPains.trackedVendorId, vendorId))
      .orderBy(desc(vendorPains.intensityScore));

    const avgIntensity = pains.length > 0
      ? Math.round(pains.reduce((sum, p) => sum + p.intensityScore, 0) / pains.length)
      : 0;

    const avgFrequency = pains.length > 0
      ? Math.round(pains.reduce((sum, p) => sum + p.frequencyScore, 0) / pains.length)
      : 0;

    const fixedCount = pains.filter((p) => p.fixDetected).length;
    const growingCount = pains.filter((p) => p.trendDirection === "growing").length;

    profiles.push({
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      sector: vendor.sector,
      totalPains: pains.length,
      avgIntensity,
      avgFrequency,
      fixedCount,
      growingCount,
      topPains: pains.slice(0, 5).map((p) => ({
        id: p.id,
        title: p.title,
        intensityScore: p.intensityScore,
        trendDirection: p.trendDirection,
        fixDetected: p.fixDetected,
      })),
    });
  }

  return { profiles };
}
