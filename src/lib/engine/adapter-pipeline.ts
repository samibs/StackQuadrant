// ============================================
// Core Quadrant Engine — Adapter Pipeline
// Orchestrates source adapter runs, signal ingestion, and run tracking
// ============================================

import { db } from "@/lib/db";
import { rawSignals, sourceAdapterRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SourceAdapter, NormalizedSignal } from "./types";

/**
 * Run a source adapter: fetch signals, normalize, store, and track the run.
 * Each adapter run is fully tracked in the source_adapter_runs table.
 */
export async function runAdapter(adapter: SourceAdapter): Promise<{
  runId: string;
  signalsFetched: number;
  status: "completed" | "failed";
  error?: string;
}> {
  // Create a run record
  const [run] = await db.insert(sourceAdapterRuns).values({
    adapterId: adapter.config.id,
    domainId: adapter.config.domainId,
    status: "running",
    startedAt: new Date(),
  }).returning({ id: sourceAdapterRuns.id });

  try {
    // Fetch raw signals from the source
    const raw = await adapter.fetch();

    // Normalize signals
    const normalized = await adapter.normalize(raw);

    // Store normalized signals in the database
    let stored = 0;
    if (normalized.length > 0) {
      stored = await storeSignals(adapter.config.domainId, normalized);
    }

    // Mark run as completed
    await db.update(sourceAdapterRuns).set({
      status: "completed",
      signalsFetched: stored,
      completedAt: new Date(),
    }).where(eq(sourceAdapterRuns.id, run.id));

    return { runId: run.id, signalsFetched: stored, status: "completed" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Mark run as failed
    await db.update(sourceAdapterRuns).set({
      status: "failed",
      completedAt: new Date(),
      errorMessage,
    }).where(
      require("drizzle-orm").eq(sourceAdapterRuns.id, run.id)
    );

    return { runId: run.id, signalsFetched: 0, status: "failed", error: errorMessage };
  }
}

/**
 * Store normalized signals in the raw_signals table.
 * Deduplicates by source URL to avoid storing the same signal twice.
 */
async function storeSignals(domainId: string, signals: NormalizedSignal[]): Promise<number> {
  let stored = 0;

  for (const signal of signals) {
    try {
      await db.insert(rawSignals).values({
        domainId,
        sourceType: signal.sourceType,
        sourceUrl: signal.url,
        content: signal.content,
        author: signal.author ?? null,
        signalTimestamp: signal.timestamp,
        metadata: signal.metadata,
        processed: false,
      });
      stored++;
    } catch (error) {
      // Skip duplicate signals (source_url may already exist)
      if (error instanceof Error && error.message.includes("duplicate")) {
        continue;
      }
      console.error(`Failed to store signal from ${signal.sourceType}:`, error);
    }
  }

  return stored;
}

/**
 * Run multiple adapters in sequence with isolation.
 * One adapter failure does not affect others.
 */
export async function runAdapters(adapters: SourceAdapter[]): Promise<{
  results: Array<{ adapterId: string; status: "completed" | "failed"; signalsFetched: number; error?: string }>;
  totalSignals: number;
}> {
  const results: Array<{ adapterId: string; status: "completed" | "failed"; signalsFetched: number; error?: string }> = [];
  let totalSignals = 0;

  for (const adapter of adapters) {
    if (!adapter.config.enabled) {
      continue;
    }

    const result = await runAdapter(adapter);
    results.push({
      adapterId: adapter.config.id,
      status: result.status,
      signalsFetched: result.signalsFetched,
      error: result.error,
    });
    totalSignals += result.signalsFetched;
  }

  return { results, totalSignals };
}
