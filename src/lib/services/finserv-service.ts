// ============================================
// FinServ Service — Financial services intelligence queries
// Sectors, regulations, vendors, alerts, pain data
// ============================================

import { db } from "@/lib/db";
import { regulations, trackedVendors, vendorPains, alertConfigs, teams } from "@/lib/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { getTeamPlanLimits } from "@/lib/services/team-service";

// ============================================
// Sector Taxonomy
// ============================================

export interface SectorInfo {
  id: string;
  name: string;
  subCategories: string[];
}

const SECTORS: SectorInfo[] = [
  { id: "fund", name: "Fund Industry", subCategories: ["Fund administration", "ManCo", "Depositary", "Transfer agency", "Investor services"] },
  { id: "banking", name: "Banking", subCategories: ["Retail banking", "Corporate banking", "Investment banking", "Payments", "Digital banking"] },
  { id: "audit", name: "Audit", subCategories: ["External audit", "Internal audit", "Forensic audit", "IT audit"] },
  { id: "wealth", name: "Wealth Management", subCategories: ["Private banking", "Family offices", "Independent wealth advisors", "Robo-advisory"] },
  { id: "fiduciary", name: "Fiduciaries", subCategories: ["Corporate services", "Trust administration", "Board governance", "Substance services"] },
  { id: "accounting", name: "Accounting", subCategories: ["Tax advisory", "Bookkeeping", "Management accounting", "Statutory reporting", "E-invoicing"] },
];

export function getSectors(): SectorInfo[] {
  return SECTORS;
}

export function getSectorById(sectorId: string): SectorInfo | undefined {
  return SECTORS.find((s) => s.id === sectorId);
}

// ============================================
// Regulations
// ============================================

export async function listRegulations(filters?: { issuingBody?: string; status?: string; jurisdiction?: string }) {
  let query = db.select().from(regulations).$dynamic();

  const conditions = [];
  if (filters?.issuingBody) conditions.push(eq(regulations.issuingBody, filters.issuingBody));
  if (filters?.status) conditions.push(eq(regulations.status, filters.status));
  if (filters?.jurisdiction) {
    conditions.push(sql`${regulations.jurisdictions}::text ILIKE ${`%${filters.jurisdiction}%`}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(asc(regulations.implementationDeadline), desc(regulations.painScore));
}

export async function getRegulation(regId: string) {
  const [reg] = await db.select().from(regulations).where(eq(regulations.id, regId));
  return reg || null;
}

export async function createRegulation(data: {
  name: string;
  shortCode: string;
  issuingBody: string;
  jurisdictions: string[];
  effectiveDate?: string;
  implementationDeadline?: string;
  status: string;
  summary: string;
  sourceUrl: string;
  impactMap?: Record<string, number>;
  painScore?: number;
}) {
  const [reg] = await db
    .insert(regulations)
    .values({
      name: data.name,
      shortCode: data.shortCode,
      issuingBody: data.issuingBody,
      jurisdictions: data.jurisdictions,
      effectiveDate: data.effectiveDate || null,
      implementationDeadline: data.implementationDeadline || null,
      status: data.status,
      summary: data.summary,
      sourceUrl: data.sourceUrl,
      impactMap: data.impactMap || null,
      painScore: data.painScore ?? null,
    })
    .returning();
  return reg;
}

export async function updateRegulation(regId: string, updates: Partial<{
  name: string;
  status: string;
  summary: string;
  impactMap: Record<string, number>;
  painScore: number;
}>) {
  const [updated] = await db
    .update(regulations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(regulations.id, regId))
    .returning();
  return updated || null;
}

// ============================================
// Tracked Vendors
// ============================================

export async function listTrackedVendors(teamId: string, sector?: string) {
  const conditions = [eq(trackedVendors.teamId, teamId)];
  if (sector) conditions.push(eq(trackedVendors.sector, sector));

  return db
    .select()
    .from(trackedVendors)
    .where(and(...conditions))
    .orderBy(trackedVendors.vendorName);
}

export async function getTrackedVendor(vendorId: string) {
  const [vendor] = await db.select().from(trackedVendors).where(eq(trackedVendors.id, vendorId));
  return vendor || null;
}

export async function addTrackedVendor(
  teamId: string,
  data: { vendorName: string; vendorAliases?: string[]; sector: string }
) {
  const team = await db.select().from(teams).where(eq(teams.id, teamId)).then((r) => r[0]);
  if (!team) return { success: false as const, code: "NOT_FOUND", message: "Team not found" };

  const limits = getTeamPlanLimits(team.planCode);
  const existing = await listTrackedVendors(teamId);
  if (existing.length >= limits.maxVendors) {
    return { success: false as const, code: "PLAN_LIMIT_REACHED", message: `Plan allows max ${limits.maxVendors} tracked vendors` };
  }

  const [vendor] = await db
    .insert(trackedVendors)
    .values({
      teamId,
      vendorName: data.vendorName,
      vendorAliases: data.vendorAliases || [],
      sector: data.sector,
    })
    .returning();

  return { success: true as const, vendor };
}

export async function removeTrackedVendor(vendorId: string) {
  await db.delete(trackedVendors).where(eq(trackedVendors.id, vendorId));
}

// ============================================
// Vendor Pains
// ============================================

export async function getVendorPains(vendorId: string) {
  return db
    .select()
    .from(vendorPains)
    .where(eq(vendorPains.trackedVendorId, vendorId))
    .orderBy(desc(vendorPains.intensityScore));
}

export async function getVendorDetail(vendorId: string) {
  const vendor = await getTrackedVendor(vendorId);
  if (!vendor) return null;

  const pains = await getVendorPains(vendorId);
  return { ...vendor, pains };
}

// ============================================
// Alert Configurations
// ============================================

export async function listAlerts(teamId: string, userId?: string) {
  const conditions = [eq(alertConfigs.teamId, teamId)];
  if (userId) conditions.push(eq(alertConfigs.userId, userId));

  return db
    .select()
    .from(alertConfigs)
    .where(and(...conditions))
    .orderBy(desc(alertConfigs.createdAt));
}

export async function createAlert(data: {
  teamId: string;
  userId: string;
  alertType: string;
  topicFilter: Record<string, unknown>;
  threshold: number;
  channel: string;
}) {
  const [alert] = await db.insert(alertConfigs).values(data).returning();
  return alert;
}

export async function deleteAlert(alertId: string, userId: string) {
  await db.delete(alertConfigs).where(and(eq(alertConfigs.id, alertId), eq(alertConfigs.userId, userId)));
}

// ============================================
// Sector Pain Aggregation
// ============================================

export async function getSectorPains(sectorId: string, teamId: string) {
  // Get vendor pains for all tracked vendors in this sector for this team
  const vendorPainList = await db
    .select({
      vendorPain: vendorPains,
      vendorName: trackedVendors.vendorName,
    })
    .from(vendorPains)
    .innerJoin(trackedVendors, eq(trackedVendors.id, vendorPains.trackedVendorId))
    .where(and(eq(trackedVendors.teamId, teamId), eq(trackedVendors.sector, sectorId)))
    .orderBy(desc(vendorPains.intensityScore));

  return vendorPainList.map((vp) => ({
    ...vp.vendorPain,
    vendorName: vp.vendorName,
  }));
}
