// StackQuadrant DORA-aligned incident intelligence and proprietary risk scoring.
// Regulatory source data and StackQuadrant scoring methodology are deliberately separated.

import { db } from "@/lib/db";
import {
  doraIncidentCategories,
  esaIncidentReports,
  vendorDoraIncidents,
  vendorDoraRiskScores,
  trackedVendors,
} from "@/lib/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  calculateVendorRiskScore,
  SCORING_MODEL_VERSION,
} from "@/lib/services/finserv-dora-score";

const SCORE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RECOMPUTE_BATCH_SIZE = 25;

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

export async function listDoraCategories(): Promise<DoraCategory[]> {
  const rows = await db
    .select()
    .from(doraIncidentCategories)
    .where(eq(doraIncidentCategories.isActive, true))
    .orderBy(asc(doraIncidentCategories.displayOrder));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    severityWeight: row.severityWeight,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
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

export async function listEsaReports(): Promise<EsaReport[]> {
  const rows = await db.select().from(esaIncidentReports).orderBy(desc(esaIncidentReports.reportDate));
  return rows.map(toEsaReport);
}

export async function getEsaReport(reportId: string): Promise<EsaReport | null> {
  const [row] = await db.select().from(esaIncidentReports).where(eq(esaIncidentReports.id, reportId));
  return row ? toEsaReport(row) : null;
}

function toEsaReport(row: typeof esaIncidentReports.$inferSelect): EsaReport {
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
      reportTitle: data.reportTitle.trim(),
      reportDate: data.reportDate,
      reportPeriodStart: data.reportPeriodStart || null,
      reportPeriodEnd: data.reportPeriodEnd || null,
      sourceUrl: data.sourceUrl,
      summary: data.summary.trim(),
      categoryDistribution: data.categoryDistribution || {},
      totalIncidents: data.totalIncidents ?? 0,
    })
    .returning();

  // Do not synchronously recompute every vendor in an HTTP request.
  // Bulk recomputation remains available as an explicit background/operational job.
  return toEsaReport(row);
}

export async function listVendorIncidents(vendorId: string): Promise<VendorIncident[]> {
  const rows = await db
    .select()
    .from(vendorDoraIncidents)
    .where(eq(vendorDoraIncidents.trackedVendorId, vendorId))
    .orderBy(desc(vendorDoraIncidents.occurredAt));

  return rows.map((row) => ({
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
  const [vendor] = await db.select().from(trackedVendors).where(eq(trackedVendors.id, vendorId));
  if (!vendor) return { success: false, code: "NOT_FOUND", message: "Vendor not found" };

  const category = await getDoraCategory(data.categoryId);
  if (!category || !category.isActive) {
    return { success: false, code: "INVALID_CATEGORY", message: `Unknown or inactive DORA-aligned category: ${data.categoryId}` };
  }

  if (!Number.isInteger(data.severity) || data.severity < 1 || data.severity > 5) {
    return { success: false, code: "INVALID_SEVERITY", message: "Severity must be an integer from 1 to 5" };
  }

  const title = data.title.trim();
  const description = data.description.trim();
  if (!title || title.length > 240) {
    return { success: false, code: "INVALID_TITLE", message: "Title must contain 1-240 characters" };
  }
  if (!description) {
    return { success: false, code: "INVALID_DESCRIPTION", message: "Description is required" };
  }

  const occurredAt = new Date(data.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    return { success: false, code: "INVALID_DATE", message: "occurredAt is not a valid timestamp" };
  }

  let resolvedAt: Date | null = null;
  if (data.resolvedAt) {
    resolvedAt = new Date(data.resolvedAt);
    if (Number.isNaN(resolvedAt.getTime())) {
      return { success: false, code: "INVALID_DATE", message: "resolvedAt is not a valid timestamp" };
    }
    if (resolvedAt < occurredAt) {
      return { success: false, code: "INVALID_DATE_ORDER", message: "resolvedAt cannot precede occurredAt" };
    }
  }

  if (data.esaReportId && !(await getEsaReport(data.esaReportId))) {
    return { success: false, code: "INVALID_ESA_REPORT", message: "Referenced ESA report does not exist" };
  }

  const [row] = await db
    .insert(vendorDoraIncidents)
    .values({
      trackedVendorId: vendorId,
      categoryId: data.categoryId,
      esaReportId: data.esaReportId || null,
      title,
      description,
      severity: data.severity,
      occurredAt,
      resolvedAt,
      disclosureUrl: data.disclosureUrl || null,
      reportedBy: data.reportedBy || null,
    })
    .returning();

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

export async function deleteVendorIncident(vendorId: string, incidentId: string): Promise<boolean> {
  const ownershipPredicate = and(
    eq(vendorDoraIncidents.id, incidentId),
    eq(vendorDoraIncidents.trackedVendorId, vendorId)
  );

  const [row] = await db.select().from(vendorDoraIncidents).where(ownershipPredicate);
  if (!row) return false;

  await db.delete(vendorDoraIncidents).where(ownershipPredicate);
  await computeVendorRiskScore(vendorId);
  return true;
}

export async function computeVendorRiskScore(vendorId: string): Promise<{
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
}> {
  const [incidents, categories] = await Promise.all([
    listVendorIncidents(vendorId),
    listDoraCategories(),
  ]);
  const weightMap = new Map(categories.map((category) => [category.id, Number(category.severityWeight)]));
  const calculated = calculateVendorRiskScore(incidents, weightMap, new Date());

  const [latestReport] = await db
    .select({ id: esaIncidentReports.id })
    .from(esaIncidentReports)
    .orderBy(desc(esaIncidentReports.reportDate))
    .limit(1);

  await db
    .insert(vendorDoraRiskScores)
    .values({
      trackedVendorId: vendorId,
      riskScore: calculated.riskScore.toFixed(2),
      incidentCount: calculated.incidentCount,
      categoryBreakdown: calculated.categoryBreakdown,
      lastEsaReportId: latestReport?.id || null,
      scoringModelVersion: SCORING_MODEL_VERSION,
      computedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: vendorDoraRiskScores.trackedVendorId,
      set: {
        riskScore: calculated.riskScore.toFixed(2),
        incidentCount: calculated.incidentCount,
        categoryBreakdown: calculated.categoryBreakdown,
        lastEsaReportId: latestReport?.id || null,
        scoringModelVersion: SCORING_MODEL_VERSION,
        computedAt: new Date(),
      },
    });

  return calculated;
}

export async function getVendorRiskScore(vendorId: string): Promise<{
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
  computedAt: Date;
  lastEsaReportId: string | null;
  scoringModelVersion: string;
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
    scoringModelVersion: row.scoringModelVersion,
  };
}

export async function recomputeAllVendorRiskScores(_triggerReportId?: string): Promise<{ updated: number }> {
  const vendors = await db.select({ id: trackedVendors.id }).from(trackedVendors);
  let updated = 0;

  for (let offset = 0; offset < vendors.length; offset += RECOMPUTE_BATCH_SIZE) {
    const batch = vendors.slice(offset, offset + RECOMPUTE_BATCH_SIZE);
    await Promise.all(batch.map((vendor) => computeVendorRiskScore(vendor.id)));
    updated += batch.length;
  }

  return { updated };
}

export async function getVendorDoraSummary(vendorId: string): Promise<{
  vendorId: string;
  riskScore: number;
  incidentCount: number;
  categoryBreakdown: Record<string, { count: number; weightedScore: number }>;
  incidents: VendorIncident[];
  categories: DoraCategory[];
  latestEsaReport: EsaReport | null;
  scoringModelVersion: string;
}> {
  const [incidents, categories, cached] = await Promise.all([
    listVendorIncidents(vendorId),
    listDoraCategories(),
    getVendorRiskScore(vendorId),
  ]);

  const cacheIsStale = !cached
    || cached.scoringModelVersion !== SCORING_MODEL_VERSION
    || Date.now() - cached.computedAt.getTime() > SCORE_CACHE_TTL_MS;

  let scoreSnapshot = cached;
  if (cacheIsStale) {
    await computeVendorRiskScore(vendorId);
    scoreSnapshot = await getVendorRiskScore(vendorId);
  }
  if (!scoreSnapshot) {
    throw new Error(`Unable to compute DORA-aligned risk score for vendor ${vendorId}`);
  }

  const [latestReportRow] = await db
    .select()
    .from(esaIncidentReports)
    .orderBy(desc(esaIncidentReports.reportDate))
    .limit(1);

  return {
    vendorId,
    riskScore: scoreSnapshot.riskScore,
    incidentCount: scoreSnapshot.incidentCount,
    categoryBreakdown: scoreSnapshot.categoryBreakdown,
    incidents,
    categories,
    latestEsaReport: latestReportRow ? toEsaReport(latestReportRow) : null,
    scoringModelVersion: scoreSnapshot.scoringModelVersion,
  };
}

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

  const scored = vendorRows.map((row) => ({
    vendorId: row.id,
    vendorName: row.vendorName,
    riskScore: row.riskScore ? Number(row.riskScore) : 0,
    incidentCount: row.incidentCount ?? 0,
  }));

  const avgRiskScore = scored.length
    ? scored.reduce((sum, vendor) => sum + vendor.riskScore, 0) / scored.length
    : 0;

  return {
    sector: sector || null,
    vendorCount: scored.length,
    avgRiskScore: Math.round(avgRiskScore * 100) / 100,
    highRiskVendors: scored
      .filter((vendor) => vendor.riskScore >= 40)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20),
  };
}
