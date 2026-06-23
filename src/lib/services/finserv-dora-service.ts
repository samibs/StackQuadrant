// ============================================
// FinServ DORA Service — Incident taxonomy & severity-weighted risk scoring
// Maps ESA-published DORA incident categories to vendor disclosure history
// ============================================

import { db } from "@/lib/db";
import {
  doraIncidentCategories,
  esaIncidentReports,
  vendorDoraIncidents,
  vendorDoraRiskScores,
  trackedVendors,
} from "@/lib/db/schema";
import { eq, desc, sql, asc } from "drizzle-orm";

export interface DoraCategory {
  id: string;
  name: string;
  description: string;
  severityWeight: string;
  displayOrder: number;
  isActive: boolean;
}

export interface EsaReport {
  id: string;
  reportTitle: string;
  reportDate: string;
  reportPeriodStart: string | null;
  reportPeriodEnd: string | null;
  sourceUrl: string;
  summary: string;
  categoryDistribution: Record<string, number>;
  totalIncidents: number;
}

export interface VendorIncident {
  id: string;
  trackedVendorId: string;
  categoryId: string;
  esaReportId: string | null;
  title: string;
  description: string;
  severity: number;
  occurredAt: Date;
  resolvedAt: Date | null;
  disclosureUrl: string | null;
  reportedBy: string | null;
}

// ============================================
// Categories
// ============================================

export async function listDoraCategories(): Promise<DoraCategory[]> {
  const rows = await db
    .select()
    .from(doraIncidentCategories)
    .where(eq(doraIncidentCategories.isActive, true))
    .orderBy(asc(doraIncidentCategories.displayOrder));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    severityWeight: r.severityWeight,
    displayOrder: r.displayOrder,
    isActive: r.isActive,
  }));
}

export async function getDoraCategory(categoryId: string): Promise<DoraCategory | null> {
  const [row] = await db
    .select()
    .from(doraIncidentCategories)
    .where(eq(doraIncidentCategories.id, categoryId));
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    severityWeight: row.severityWeight,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
  };
}

// ============================================
// ESA Reports
// ============================================

export async function listEsaReports(): Promise<EsaReport[]> {
  const rows = await db
    .select()
    .from(esaIncidentReports)
    .orderBy(desc(esaIncidentReports.reportDate));

  return rows.map((r) => ({
    id: r.id,
    reportTitle: r.reportTitle,
    reportDate: String(r.reportDate),
    reportPeriodStart: r.reportPeriodStart ? String(r.reportPeriodStart) : null,
    reportPeriodEnd: r.reportPeriodEnd ? String(r.reportPeriodEnd) : null,
    sourceUrl: r.sourceUrl,
    summary: r.summary,
    categoryDistribution: r.categoryDistribution as Record<string, number>,
    totalIncidents: r.totalIncidents,
  }));
}

export async function getEsaReport(reportId: string): Promise<EsaReport | null> {
  const [row] = await db
    .select()
    .from(esaIncidentReports)
    .where(eq(esaIncidentReports.id, reportId));
  if (!row) return null;
  return {
    id: row.id,
    reportTitle: row.reportTitle,
    reportDate: String(row.reportDate),
    reportPeriodStart: row.reportPeriodStart ? String(row.reportPeriodStart) : null,
    reportPeriodEnd: row.reportPeriodEnd ? String(row.reportPeriodEnd) : null,
    sourceUrl: row.sourceUrl,
    summary: row.summary,
    categoryDistribution: row.categoryDistribution as Record<string, number>,
    totalIncidents: row.totalIncidents,
  };
}

export async function recordEsaReport(data: {
  reportTitle: string;
  reportDate: string;
  reportPeriodStart?: string;
  reportPeriodEnd?: string;
  sourceUrl: string;
  summary: string;
  categoryDistribution?: Record<string, number>;
  totalIncidents?: number;
}): Promise<EsaReport> {
  const [row] = await db
    .insert(esaIncidentReports)
    .values({
      reportTitle: data.reportTitle,
      reportDate: data.reportDate,
      reportPeriodStart: data.reportPeriodStart || null,
      reportPeriodEnd: data.reportPeriodEnd || null,
      sourceUrl: data.sourceUrl,
      summary: data.summary,
      categoryDistribution: data.categoryDistribution || {},
      totalIncidents: data.totalIncidents ?? 0,
    })
    .returning();

  // Recompute risk scores for all vendors against the new report baseline
  await recomputeAllVendorRiskScores(row.id);

  return {
    id: row.id,
    reportTitle: row.reportTitle,
    reportDate: String(row.reportDate),
    reportPeriodStart: row.reportPeriodStart ? String(row.reportPeriodStart) : null,
    reportPeriodEnd: row.reportPeriodEnd ? String(row.reportPeriodEnd) : null,
    sourceUrl: row.sourceUrl,
    summary: row.summary,
    categoryDistribution: row.categoryDistribution as Record<string, number>,
    totalIncidents: row.totalIncidents,
  };
}

// ============================================
// Vendor Incidents
// ============================================

export async function listVendorIncidents(vendorId: string): Promise<VendorIncident[]> {
  const rows = await db
    .select()
    .from(vendorDoraIncidents)
    .where(eq(vendorDoraIncidents.trackedVendorId, vendorId))
    .orderBy(desc(vendorDoraIncidents.occurredAt));

  return rows.map((r) => ({
    id: r.id,
    trackedVendorId: r.trackedVendorId,
    categoryId: r.categoryId,
    esaReportId: r.esaReportId,
    title: r.title,
    description: r.description,
    severity: r.severity,
    occurredAt: r.occurredAt,
    resolvedAt: r.resolvedAt,
    disclosureUrl: r.disclosureUrl,
    reportedBy: r.reportedBy,
  }));
}

export async function addVendorIncident(
  vendorId: string,
  data: {
    categoryId: string;
    title: string;
    description: string;
    severity: number;
    occurredAt: string;
    resolvedAt?: string;
    disclosureUrl?: string;
    esaReportId?: string;
    reportedBy?: string;
  }
): Promise<
  | { success: true; incident: VendorIncident }
  | { success: false; code: string; message: string }
> {
  const vendor = await db
    .select()
    .from(trackedVendors)
    .where(eq(trackedVendors.id, vendorId))
    .then((r) => r[0]);
  if (!vendor) return { success: false, code: "NOT_FOUND", message: "Vendor not found" };

  const category = await getDoraCategory(data.categoryId);
  if (!category) return { success: false, code: "INVALID_CATEGORY", message: `Unknown DORA category: ${data.categoryId}` };

  if (data.severity < 1 || data.severity > 5) {
    return { success: false, code: "INVALID_SEVERITY", message: "Severity must be 1-5" };
  }

  const occurredAt = new Date(data.occurredAt);
  if (isNaN(occurredAt.getTime())) {
    return { success: false, code: "INVALID_DATE", message: "occurredAt is not a valid ISO timestamp" };
  }

  const [row] = await db
    .insert(vendorDoraIncidents)
    .values({
      trackedVendorId: vendorId,
      categoryId: data.categoryId,
      esaReportId: data.esaReportId || null,
      title: data.title,
      description: data.description,
      severity: data.severity,
      occurredAt,
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
      disclosureUrl: data.disclosureUrl || null,
      reportedBy: data.reportedBy || null,
    })
    .returning();

  // Refresh cached risk score for this vendor
  await computeVendorRiskScore(vendorId);

  return {
    success: true,
    incident: {
      id: row.id,
      trackedVendorId: row.trackedVendorId,
      categoryId: row.categoryId,
      esaReportId: row.esaReportId,
      title: row.title,
      description: row.description,
      severity: row.severity,
      occurredAt: row.occurredAt,
      resolvedAt: row.resolvedAt,
      disclosureUrl: row.disclosureUrl,
      reportedBy: row.reportedBy,
    },
  };
}

export async function deleteVendorIncident(incidentId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(vendorDoraIncidents)
    .where(eq(vendorDoraIncidents.id, incidentId));
  if (!row) return;
  await db.delete(vendorDoraIncidents).where(eq(vendorDoraIncidents.id, incidentId));
  await computeVendorRiskScore(row.trackedVendorId);
}

// ============================================
// Severity-weighted risk score
// ============================================
//
// Score formula:
//   For each incident: weighted = severity * categoryWeight  (max 5.0)
//   Sum across incidents, normalised so 20 max-severity incidents → 100.
//
// Decay: incidents older than 730 days (2y) decay linearly to 25% weight.
// This mirrors DORA reporting horizons without erasing historical risk signal.

const MAX_SCORE = 100;
const NORMALISATION_CAP = 100; // 100 weighted units = score of 100
const DECAY_HORIZON_DAYS = 730;
const DECAY_FLOOR = 0.25;

function ageDecay(occurredAt: Date, now: Date): number {
  const ageDays = (now.getTime() - occurredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 1;
  if (ageDays >= DECAY_HORIZON_DAYS) return DECAY_FLOOR;
  const progress = ageDays / DECAY_HORIZON_DAYS;
  return 1 - progress * (1 - DECAY_FLOOR);
}

export async function computeVendorRiskScore(vendorId: string): Promise<{
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
}> {
  const incidents = await listVendorIncidents(vendorId);
  const categories = await listDoraCategories();
  const weightMap = new Map(categories.map((c) => [c.id, Number(c.severityWeight)]));

  const breakdown: Record<string, { count: number; weightedScore: number }> = {};
  let totalWeighted = 0;
  const now = new Date();

  for (const inc of incidents) {
    const catWeight = weightMap.get(inc.categoryId) ?? 0.5;
    const decay = ageDecay(inc.occurredAt, now);
    const weighted = inc.severity * catWeight * decay;
    totalWeighted += weighted;

    const entry = breakdown[inc.categoryId] || { count: 0, weightedScore: 0 };
    entry.count += 1;
    entry.weightedScore += weighted;
    breakdown[inc.categoryId] = entry;
  }

  const rawScore = (totalWeighted / NORMALISATION_CAP) * MAX_SCORE;
  const riskScore = Math.min(MAX_SCORE, Math.max(0, Math.round(rawScore * 100) / 100));

  // Persist cached score
  const [latestReport] = await db
    .select({ id: esaIncidentReports.id })
    .from(esaIncidentReports)
    .orderBy(desc(esaIncidentReports.reportDate))
    .limit(1);

  await db
    .insert(vendorDoraRiskScores)
    .values({
      trackedVendorId: vendorId,
      riskScore: riskScore.toFixed(2),
      incidentCount: incidents.length,
      categoryBreakdown: breakdown,
      lastEsaReportId: latestReport?.id || null,
      computedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: vendorDoraRiskScores.trackedVendorId,
      set: {
        riskScore: riskScore.toFixed(2),
        incidentCount: incidents.length,
        categoryBreakdown: breakdown,
        lastEsaReportId: latestReport?.id || null,
        computedAt: new Date(),
      },
    });

  return { riskScore, incidentCount: incidents.length, categoryBreakdown: breakdown };
}

export async function getVendorRiskScore(vendorId: string): Promise<{
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
  computedAt: Date;
  lastEsaReportId: string | null;
} | null> {
  const [row] = await db
    .select()
    .from(vendorDoraRiskScores)
    .where(eq(vendorDoraRiskScores.trackedVendorId, vendorId));
  if (!row) return null;
  return {
    riskScore: Number(row.riskScore),
    incidentCount: row.incidentCount,
    categoryBreakdown: row.categoryBreakdown as Record<string, { count: number; weightedScore: number }>,
    computedAt: row.computedAt,
    lastEsaReportId: row.lastEsaReportId,
  };
}

export async function recomputeAllVendorRiskScores(triggerReportId: string): Promise<{ updated: number }> {
  const vendors = await db.select({ id: trackedVendors.id }).from(trackedVendors);
  let updated = 0;
  for (const v of vendors) {
    await computeVendorRiskScore(v.id);
    updated += 1;
  }
  // touch the trigger report (no-op write) so any audit log captures the recompute event
  await db
    .update(esaIncidentReports)
    .set({ updatedAt: new Date() })
    .where(eq(esaIncidentReports.id, triggerReportId));
  return { updated };
}

// ============================================
// Vendor DORA summary (used by detail endpoint)
// ============================================

export async function getVendorDoraSummary(vendorId: string): Promise<{
  vendorId: string;
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
  incidents: VendorIncident[];
  categories: DoraCategory[];
  latestEsaReport: EsaReport | null;
}> {
  const [incidents, categories, cached] = await Promise.all([
    listVendorIncidents(vendorId),
    listDoraCategories(),
    getVendorRiskScore(vendorId),
  ]);

  let scoreSnapshot = cached;
  if (!scoreSnapshot) {
    const fresh = await computeVendorRiskScore(vendorId);
    scoreSnapshot = {
      riskScore: fresh.riskScore,
      incidentCount: fresh.incidentCount,
      categoryBreakdown: fresh.categoryBreakdown,
      computedAt: new Date(),
      lastEsaReportId: null,
    };
  }

  const [latestReportRow] = await db
    .select()
    .from(esaIncidentReports)
    .orderBy(desc(esaIncidentReports.reportDate))
    .limit(1);

  const latestEsaReport: EsaReport | null = latestReportRow
    ? {
        id: latestReportRow.id,
        reportTitle: latestReportRow.reportTitle,
        reportDate: String(latestReportRow.reportDate),
        reportPeriodStart: latestReportRow.reportPeriodStart ? String(latestReportRow.reportPeriodStart) : null,
        reportPeriodEnd: latestReportRow.reportPeriodEnd ? String(latestReportRow.reportPeriodEnd) : null,
        sourceUrl: latestReportRow.sourceUrl,
        summary: latestReportRow.summary,
        categoryDistribution: latestReportRow.categoryDistribution as Record<string, number>,
        totalIncidents: latestReportRow.totalIncidents,
      }
    : null;

  return {
    vendorId,
    riskScore: scoreSnapshot.riskScore,
    incidentCount: scoreSnapshot.incidentCount,
    categoryBreakdown: scoreSnapshot.categoryBreakdown,
    incidents,
    categories,
    latestEsaReport,
  };
}

// ============================================
// Sector-level aggregation
// ============================================

export async function getSectorDoraOverview(teamId: string, sector?: string): Promise<{
  sector: string | null;
  vendorCount: number;
  avgRiskScore: number;
  highRiskVendors: Array<{ vendorId: string; vendorName: string; riskScore: number; incidentCount: number }>;
}> {
  const vendorRows = await db
    .select({
      id: trackedVendors.id,
      vendorName: trackedVendors.vendorName,
      sector: trackedVendors.sector,
      riskScore: vendorDoraRiskScores.riskScore,
      incidentCount: vendorDoraRiskScores.incidentCount,
    })
    .from(trackedVendors)
    .leftJoin(vendorDoraRiskScores, eq(vendorDoraRiskScores.trackedVendorId, trackedVendors.id))
    .where(
      sector
        ? sql`${trackedVendors.teamId} = ${teamId} AND ${trackedVendors.sector} = ${sector}`
        : eq(trackedVendors.teamId, teamId)
    );

  const scored = vendorRows.map((r) => ({
    vendorId: r.id,
    vendorName: r.vendorName,
    riskScore: r.riskScore ? Number(r.riskScore) : 0,
    incidentCount: r.incidentCount ?? 0,
  }));

  const avg = scored.length > 0
    ? scored.reduce((sum, v) => sum + v.riskScore, 0) / scored.length
    : 0;

  const highRisk = scored
    .filter((v) => v.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20);

  return {
    sector: sector || null,
    vendorCount: scored.length,
    avgRiskScore: Math.round(avg * 100) / 100,
    highRiskVendors: highRisk,
  };
}
