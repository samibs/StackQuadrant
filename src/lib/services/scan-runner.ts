// ============================================
// Scan Runner — Orchestrates a full scan pipeline
// Adapter fetch → Normalize → AI Analysis → Store results
// ============================================

import { db } from "@/lib/db";
import { scans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { RedditAdapter, type RedditAdapterOptions } from "@/lib/adapters/reddit-adapter";
import type { NormalizedSignal, SourceAdapterConfig } from "@/lib/engine/types";
import { updateScanStatus } from "@/lib/services/scan-service";
import { analyzeSignals } from "@/lib/services/pain-analysis-service";

/**
 * Execute a full scan pipeline for a given scan ID.
 */
export async function runScan(scanId: string): Promise<void> {
  const [scan] = await db.select().from(scans).where(eq(scans.id, scanId));
  if (!scan) throw new Error(`Scan ${scanId} not found`);

  if (scan.status !== "queued") {
    console.warn(`[scan-runner] Scan ${scanId} is not in queued state (current: ${scan.status})`);
    return;
  }

  await updateScanStatus(scanId, "running");

  try {
    const allSignals: NormalizedSignal[] = [];
    const enabledSources = scan.enabledSources as string[];

    // Run each enabled adapter
    if (enabledSources.includes("reddit")) {
      const adapterConfig: SourceAdapterConfig = {
        id: `reddit-scan-${scanId}`,
        name: "Reddit Adapter",
        domainId: "paingaps-retail",
        schedule: "manual",
        rateLimits: { requests: 10, perSeconds: 60 },
        enabled: true,
      };

      const options: RedditAdapterOptions = {
        keywords: scan.targetKeywords as string[],
        subreddits: (scan.targetSubreddits as string[] | null) || undefined,
        timeframeDays: scan.timeframeDays,
        maxResults: 100,
      };

      const adapter = new RedditAdapter(adapterConfig, options);
      const raw = await adapter.fetch();
      const normalized = await adapter.normalize(raw);
      allSignals.push(...normalized);
    }

    // Analyze signals and store pain points
    await analyzeSignals(scanId, allSignals);
  } catch (error) {
    console.error(`[scan-runner] Scan ${scanId} failed:`, error);
    const errorCode = error instanceof Error ? error.message.slice(0, 60) : "UNKNOWN_ERROR";
    await updateScanStatus(scanId, "failed", errorCode);
  }
}
