// ============================================
// Pain Analysis Service — AI-powered pain point extraction from signals
// Uses OpenAI to cluster, score, and summarize pain points from raw evidence
// ============================================

import OpenAI from "openai";
import { db } from "@/lib/db";
import { painPoints, evidenceItems, scans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { NormalizedSignal } from "@/lib/engine/types";
import { updateScanStatus } from "@/lib/services/scan-service";
import { getUserPlan } from "@/lib/services/billing-service";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is required");
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

const MODEL = "gpt-4o-mini";

interface ExtractedPainPoint {
  title: string;
  summary: string;
  severityScore: number;
  frequencyScore: number;
  intensityScore: number;
  marketSizeScore: number;
  competitionScore: number;
  wtpScore: number;
  trendDirection: "growing" | "stable" | "declining";
  audienceSummary: string;
  competitorNames: string[];
  evidence: Array<{
    quoteText: string;
    sourceUrl: string;
    sourceName: string;
    author: string | null;
    originalTimestamp: string;
    sourceType: string;
  }>;
}

/**
 * Analyze signals for a scan and extract pain points.
 * This is the main entry point called by the scan runner.
 */
export async function analyzeSignals(scanId: string, signals: NormalizedSignal[]): Promise<void> {
  const [scan] = await db.select().from(scans).where(eq(scans.id, scanId));
  if (!scan) throw new Error(`Scan ${scanId} not found`);

  const plan = await getUserPlan(scan.userId);
  const maxPainPoints = plan.limits.painPointsPerScan;

  if (signals.length === 0) {
    await updateScanStatus(scanId, "completed");
    return;
  }

  // Batch signals into chunks for API calls (avoid token limits)
  const chunkSize = 30;
  const allExtracted: ExtractedPainPoint[] = [];

  for (let i = 0; i < signals.length; i += chunkSize) {
    const chunk = signals.slice(i, i + chunkSize);
    const extracted = await extractPainPoints(chunk, scan.targetKeywords as string[]);
    allExtracted.push(...extracted);
  }

  // Dedup and merge similar pain points
  const merged = deduplicatePainPoints(allExtracted);

  // Trim to plan limit and sort by severity
  const ranked = merged
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, maxPainPoints);

  // Store pain points and evidence in DB
  for (const pp of ranked) {
    const [inserted] = await db.insert(painPoints).values({
      scanId,
      title: pp.title,
      summary: pp.summary,
      severityScore: clamp(pp.severityScore, 0, 100),
      frequencyScore: clamp(pp.frequencyScore, 0, 100),
      intensityScore: clamp(pp.intensityScore, 0, 100),
      marketSizeScore: clamp(pp.marketSizeScore, 0, 100),
      competitionScore: clamp(pp.competitionScore, 0, 100),
      wtpScore: clamp(pp.wtpScore, 0, 100),
      trendDirection: pp.trendDirection,
      sourceCount: pp.evidence.length,
      audienceSummary: pp.audienceSummary,
      competitorNames: pp.competitorNames,
    }).returning({ id: painPoints.id });

    // Store evidence items
    if (pp.evidence.length > 0) {
      await db.insert(evidenceItems).values(
        pp.evidence.map(ev => ({
          painPointId: inserted.id,
          sourceType: ev.sourceType,
          quoteText: ev.quoteText.slice(0, 2000),
          sourceUrl: ev.sourceUrl,
          sourceName: ev.sourceName,
          author: ev.author?.slice(0, 240) || null,
          originalTimestamp: new Date(ev.originalTimestamp),
        }))
      );
    }
  }

  await updateScanStatus(scanId, "completed");
}

/**
 * Call OpenAI to extract pain points from a batch of signals.
 */
async function extractPainPoints(signals: NormalizedSignal[], keywords: string[]): Promise<ExtractedPainPoint[]> {
  const signalTexts = signals.map((s, i) => {
    const meta = s.metadata as Record<string, unknown>;
    return `[Signal ${i + 1}] Source: ${s.sourceType} | URL: ${s.url} | Author: ${s.author || "unknown"} | Date: ${s.timestamp.toISOString()} | Subreddit: ${meta.subreddit || "N/A"}\n${s.content.slice(0, 1000)}`;
  }).join("\n---\n");

  const systemPrompt = `You are a market research analyst specialized in identifying consumer pain points from online discussions. Analyze the provided signals and extract distinct pain points.

For each pain point:
1. Title: Concise, specific problem statement (max 240 chars)
2. Summary: 2-3 sentence explanation of the pain point
3. Severity scores (0-100 scale):
   - severityScore: Overall severity combining frequency, intensity, and impact
   - frequencyScore: How often this problem is mentioned
   - intensityScore: How strongly people feel about this issue
   - marketSizeScore: Estimated market size affected
   - competitionScore: How well current solutions address this (100 = poorly addressed, good opportunity)
   - wtpScore: Willingness to pay for a solution
4. trendDirection: "growing", "stable", or "declining"
5. audienceSummary: Who experiences this pain point
6. competitorNames: Existing products/services mentioned as current (imperfect) solutions
7. evidence: Direct quotes from the signals that support this pain point

Respond with valid JSON only. No markdown fences.`;

  const userPrompt = `Keywords being researched: ${keywords.join(", ")}

Analyze these ${signals.length} signals and extract pain points:

${signalTexts}

Return JSON: { "painPoints": [ { "title": "...", "summary": "...", "severityScore": N, "frequencyScore": N, "intensityScore": N, "marketSizeScore": N, "competitionScore": N, "wtpScore": N, "trendDirection": "growing|stable|declining", "audienceSummary": "...", "competitorNames": ["..."], "evidence": [{ "quoteText": "...", "sourceUrl": "...", "sourceName": "...", "author": "...", "originalTimestamp": "ISO-date", "sourceType": "reddit" }] } ] }`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { painPoints: ExtractedPainPoint[] };
    return Array.isArray(parsed.painPoints) ? parsed.painPoints : [];
  } catch (error) {
    console.error("[pain-analysis] OpenAI extraction failed:", error);
    return [];
  }
}

/**
 * Merge similar pain points based on title similarity.
 */
function deduplicatePainPoints(points: ExtractedPainPoint[]): ExtractedPainPoint[] {
  const merged: ExtractedPainPoint[] = [];

  for (const pp of points) {
    const existing = merged.find(m => isSimilar(m.title, pp.title));

    if (existing) {
      // Merge: average scores, combine evidence
      existing.severityScore = Math.round((existing.severityScore + pp.severityScore) / 2);
      existing.frequencyScore = Math.round((existing.frequencyScore + pp.frequencyScore) / 2);
      existing.intensityScore = Math.round((existing.intensityScore + pp.intensityScore) / 2);
      existing.marketSizeScore = Math.round((existing.marketSizeScore + pp.marketSizeScore) / 2);
      existing.competitionScore = Math.round((existing.competitionScore + pp.competitionScore) / 2);
      existing.wtpScore = Math.round((existing.wtpScore + pp.wtpScore) / 2);
      existing.evidence.push(...pp.evidence);
      existing.competitorNames = [...new Set([...existing.competitorNames, ...pp.competitorNames])];
    } else {
      merged.push({ ...pp });
    }
  }

  return merged;
}

/**
 * Simple title similarity check using normalized Jaccard coefficient.
 */
function isSimilar(a: string, b: string): boolean {
  const tokenize = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2));
  const setA = tokenize(a);
  const setB = tokenize(b);

  if (setA.size === 0 || setB.size === 0) return false;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 && intersection / union > 0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
