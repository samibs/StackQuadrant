// ============================================
// Opportunity Universe Service — Historical pain point search for Pro users
// Enables searching across all completed scans with filters
// ============================================

import { db } from "@/lib/db";
import { painPoints, scans, evidenceItems } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";

export interface UniverseSearchParams {
  keyword?: string;
  sourceType?: string;
  minSeverity?: number;
  maxSeverity?: number;
  trendDirection?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function searchUniverse(params: UniverseSearchParams) {
  const {
    keyword,
    sourceType,
    minSeverity = 0,
    maxSeverity = 100,
    trendDirection,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = params;

  const offset = (page - 1) * limit;
  const conditions = [eq(scans.status, "completed")];

  if (minSeverity > 0) conditions.push(gte(painPoints.severityScore, minSeverity));
  if (maxSeverity < 100) conditions.push(lte(painPoints.severityScore, maxSeverity));
  if (trendDirection) conditions.push(eq(painPoints.trendDirection, trendDirection));
  if (dateFrom) conditions.push(gte(painPoints.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(painPoints.createdAt, new Date(dateTo)));

  let query = db
    .select({
      id: painPoints.id,
      title: painPoints.title,
      summary: painPoints.summary,
      severityScore: painPoints.severityScore,
      frequencyScore: painPoints.frequencyScore,
      marketSizeScore: painPoints.marketSizeScore,
      competitionScore: painPoints.competitionScore,
      wtpScore: painPoints.wtpScore,
      trendDirection: painPoints.trendDirection,
      sourceCount: painPoints.sourceCount,
      competitorNames: painPoints.competitorNames,
      createdAt: painPoints.createdAt,
    })
    .from(painPoints)
    .innerJoin(scans, eq(scans.id, painPoints.scanId))
    .where(and(...conditions))
    .$dynamic();

  if (keyword) {
    const searchTerm = `%${keyword.toLowerCase()}%`;
    query = query.where(
      sql`(LOWER(${painPoints.title}) LIKE ${searchTerm} OR LOWER(${painPoints.summary}) LIKE ${searchTerm})`
    );
  }

  // If filtering by source type, join evidence_items
  if (sourceType) {
    query = query.where(
      sql`EXISTS (
        SELECT 1 FROM evidence_items ei
        WHERE ei.pain_point_id = ${painPoints.id}
        AND ei.source_type = ${sourceType}
      )`
    );
  }

  const results = await query
    .orderBy(desc(painPoints.severityScore))
    .limit(limit)
    .offset(offset);

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(painPoints)
    .innerJoin(scans, eq(scans.id, painPoints.scanId))
    .where(and(...conditions));

  return {
    results,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

// Competitive gap tagging — extract product/tool names mentioned in pain signals
export function extractCompetitiveGaps(content: string): string[] {
  const gaps: string[] = [];

  // Common patterns that reference specific products
  const patterns = [
    /(?:I (?:hate|can't stand|am frustrated with|wish) (?:that )?)([\w\s]+?)(?:\s+(?:can't|doesn't|won't|isn't))/gi,
    /(?:switched? (?:from|away from) )([\w\s]+)/gi,
    /(?:alternative to )([\w\s]+)/gi,
    /(?:compared to )([\w\s]+?)(?:\s*,|\s+(?:is|was|seems))/gi,
    /([\w]+)\s+(?:sucks|is terrible|is awful|is broken|doesn't work)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1].trim();
      // Filter out common non-product words
      const skipWords = ["it", "this", "that", "the", "my", "their", "our", "your", "i", "they", "we", "you"];
      if (name.length >= 2 && name.length <= 60 && !skipWords.includes(name.toLowerCase())) {
        gaps.push(name);
      }
    }
  }

  return [...new Set(gaps)];
}
