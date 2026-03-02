// ============================================
// FinServ Practice Intelligence Service
// Practice pain dashboards for audit/accounting sectors
// Service opportunity detection, talent tracking
// ============================================

import { db } from "@/lib/db";
import { vendorPains, trackedVendors } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Practice pain categories for audit/accounting
const PRACTICE_CATEGORIES = {
  operational: ["workflow", "process", "efficiency", "automation", "manual", "bottleneck"],
  technology: ["software", "system", "platform", "integration", "tool", "migration"],
  talent: ["hiring", "retention", "burnout", "staffing", "training", "skills gap", "turnover"],
  regulatory: ["compliance", "regulation", "audit standard", "reporting requirement"],
  client: ["client expectation", "client demand", "client pain", "advisory", "service gap"],
};

export interface PracticePain {
  id: string;
  title: string;
  summary: string;
  category: string;
  intensityScore: number;
  frequencyScore: number;
  trendDirection: string;
  evidenceCount: number;
  vendorName: string;
}

export async function getPracticeDashboard(teamId: string, sector: string = "audit") {
  // Get all vendor pains for practice-related sectors
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
    .where(and(
      eq(trackedVendors.teamId, teamId),
      sql`${trackedVendors.sector} IN ('audit', 'accounting')`,
    ))
    .orderBy(desc(vendorPains.intensityScore))
    .limit(20);

  // Categorize pains
  const categorized = pains.map((pain) => ({
    ...pain,
    category: categorizePain(pain.title + " " + pain.summary),
  }));

  // Group by category for dashboard
  const byCategory = Object.keys(PRACTICE_CATEGORIES).reduce((acc, cat) => {
    acc[cat] = categorized.filter((p) => p.category === cat);
    return acc;
  }, {} as Record<string, PracticePain[]>);

  return { pains: categorized, byCategory, sector };
}

export async function getServiceOpportunities(teamId: string) {
  // Service opportunities are client-facing pains with high intensity that suggest new advisory services
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
      sector: trackedVendors.sector,
    })
    .from(vendorPains)
    .innerJoin(trackedVendors, eq(trackedVendors.id, vendorPains.trackedVendorId))
    .where(and(
      eq(trackedVendors.teamId, teamId),
      sql`${trackedVendors.sector} IN ('audit', 'accounting')`,
    ))
    .orderBy(desc(vendorPains.intensityScore))
    .limit(30);

  // Filter for client-facing pains (those that suggest service opportunities)
  const opportunities = pains
    .filter((p) => {
      const text = (p.title + " " + p.summary).toLowerCase();
      return text.includes("client") || text.includes("advisory") || text.includes("service") ||
        text.includes("demand") || text.includes("need") || text.includes("gap");
    })
    .map((p) => ({
      ...p,
      opportunityScore: Math.round((p.intensityScore * 0.4 + p.frequencyScore * 0.3 + (p.trendDirection === "growing" ? 30 : 10)) ),
      demandIndicator: p.trendDirection === "growing" ? "high" : p.trendDirection === "stable" ? "moderate" : "low",
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  return { opportunities };
}

export async function getTalentPains(teamId: string) {
  // Filter for talent-related pains
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
    .where(eq(trackedVendors.teamId, teamId))
    .orderBy(desc(vendorPains.intensityScore));

  const talentKeywords = PRACTICE_CATEGORIES.talent;
  const talentPains = pains.filter((p) => {
    const text = (p.title + " " + p.summary).toLowerCase();
    return talentKeywords.some((kw) => text.includes(kw));
  }).map((p) => ({
    ...p,
    talentCategory: classifyTalentPain(p.title + " " + p.summary),
  }));

  return { talentPains };
}

function categorizePain(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(PRACTICE_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "operational";
}

function classifyTalentPain(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("retention") || lower.includes("turnover") || lower.includes("leaving")) return "retention";
  if (lower.includes("hiring") || lower.includes("recruit") || lower.includes("finding")) return "hiring";
  if (lower.includes("burnout") || lower.includes("overwork") || lower.includes("stress")) return "burnout";
  if (lower.includes("skill") || lower.includes("training") || lower.includes("learning")) return "skills_gap";
  return "general";
}
