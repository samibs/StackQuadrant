/**
 * Scan Queue Worker
 * Picks up queued scans and runs them sequentially.
 * Designed to be run via PM2 cron (every 15 minutes).
 *
 * Usage: npx tsx scripts/scan-queue-worker.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, sql, asc } from "drizzle-orm";
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// Inline schema (standalone script — no Next.js imports)
const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  targetKeywords: jsonb("target_keywords").notNull().$type<string[]>(),
  targetSubreddits: jsonb("target_subreddits").$type<string[]>(),
  targetAppCategories: jsonb("target_app_categories").$type<string[]>(),
  enabledSources: jsonb("enabled_sources").notNull().$type<string[]>(),
  timeframeDays: integer("timeframe_days").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorCode: varchar("error_code", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const painPoints = pgTable("pain_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  scanId: uuid("scan_id").notNull(),
});

// Reddit fetch helpers
const REDDIT_BASE = "https://www.reddit.com";
const USER_AGENT = "StackQuadrant-PainGaps/1.0";

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  author: string;
  url: string;
}

async function fetchRedditPosts(
  keywords: string[],
  subreddits: string[] | null,
  timeframeDays: number,
  maxResults: number = 100,
): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  const seen = new Set<string>();
  const timeFilter = timeframeDays <= 7 ? "week" : timeframeDays <= 30 ? "month" : "year";

  for (const keyword of keywords) {
    if (posts.length >= maxResults) break;

    const targets = subreddits && subreddits.length > 0
      ? subreddits.map((s) => `${REDDIT_BASE}/r/${s}/search.json?q=${encodeURIComponent(keyword)}&restrict_sr=1&sort=relevance&t=${timeFilter}&limit=25`)
      : [`${REDDIT_BASE}/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&t=${timeFilter}&limit=25`];

    for (const url of targets) {
      if (posts.length >= maxResults) break;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT },
        });

        if (!res.ok) {
          console.warn(`[scan-worker] Reddit fetch failed: ${res.status} for ${url}`);
          continue;
        }

        const data = await res.json();
        const children = data?.data?.children || [];

        for (const child of children) {
          const post = child.data as RedditPost;
          if (seen.has(post.permalink)) continue;
          seen.add(post.permalink);

          // Filter by actual timeframe
          const postAge = (Date.now() / 1000 - post.created_utc) / 86400;
          if (postAge > timeframeDays) continue;

          posts.push(post);
          if (posts.length >= maxResults) break;
        }

        // Rate limit: 1 request per second
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.warn(`[scan-worker] Reddit error for "${keyword}":`, err instanceof Error ? err.message : err);
      }
    }
  }

  return posts;
}

// Simple signal analysis (categorize pain signals without external AI dependency)
function analyzePainSignals(posts: RedditPost[]): Array<{
  title: string;
  description: string;
  severity: number;
  source: string;
  sourceUrl: string;
  rawSignal: object;
}> {
  const painIndicators = [
    "frustrated", "broken", "bug", "issue", "problem", "hate", "terrible",
    "slow", "crash", "error", "fix", "help", "stuck", "annoying", "painful",
    "disappointed", "worse", "fail", "can't", "won't", "doesn't work",
  ];

  return posts.map((post) => {
    const text = `${post.title} ${post.selftext}`.toLowerCase();
    const matchCount = painIndicators.filter((ind) => text.includes(ind)).length;

    // Severity: combine pain indicators + engagement signals
    const engagementScore = Math.min(5, Math.log10(Math.max(1, post.score + post.num_comments)));
    const painScore = Math.min(5, matchCount * 1.5);
    const severity = Math.round(Math.min(10, engagementScore + painScore));

    return {
      title: post.title.slice(0, 200),
      description: (post.selftext || post.title).slice(0, 500),
      severity: Math.max(1, severity),
      source: `reddit:r/${post.subreddit}`,
      sourceUrl: `https://reddit.com${post.permalink}`,
      rawSignal: {
        score: post.score,
        comments: post.num_comments,
        author: post.author,
        created: new Date(post.created_utc * 1000).toISOString(),
      },
    };
  });
}

async function main() {
  const startTime = Date.now();
  console.log(`[scan-worker] Starting at ${new Date().toISOString()}`);

  if (!process.env.DATABASE_URL) {
    console.error("[scan-worker] DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client);

  try {
    // Pick up queued scans (oldest first, max 5 per run)
    const queuedScans = await db
      .select()
      .from(scans)
      .where(eq(scans.status, "queued"))
      .orderBy(asc(scans.createdAt))
      .limit(5);

    if (queuedScans.length === 0) {
      console.log("[scan-worker] No queued scans found");
      return;
    }

    console.log(`[scan-worker] Found ${queuedScans.length} queued scan(s)`);

    for (const scan of queuedScans) {
      console.log(`[scan-worker] Processing scan ${scan.id}...`);

      // Mark as running
      await db.update(scans).set({
        status: "running",
        startedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(scans.id, scan.id));

      try {
        const enabledSources = scan.enabledSources as string[];
        let totalSignals = 0;

        if (enabledSources.includes("reddit")) {
          const keywords = scan.targetKeywords as string[];
          const subreddits = (scan.targetSubreddits as string[] | null) || null;

          console.log(`[scan-worker]   Reddit: keywords=${keywords.join(",")} timeframe=${scan.timeframeDays}d`);

          const posts = await fetchRedditPosts(keywords, subreddits, scan.timeframeDays);
          console.log(`[scan-worker]   Fetched ${posts.length} Reddit posts`);

          const painSignals = analyzePainSignals(posts);

          // Store pain points
          for (const signal of painSignals) {
            await db.execute(sql`
              INSERT INTO pain_points (scan_id, title, description, severity, source, source_url, raw_signal)
              VALUES (${scan.id}, ${signal.title}, ${signal.description}, ${signal.severity},
                      ${signal.source}, ${signal.sourceUrl}, ${JSON.stringify(signal.rawSignal)}::jsonb)
              ON CONFLICT DO NOTHING
            `);
          }

          totalSignals += painSignals.length;
        }

        // Mark as completed
        await db.update(scans).set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(scans.id, scan.id));

        console.log(`[scan-worker]   Completed: ${totalSignals} pain points stored`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message.slice(0, 60) : "UNKNOWN_ERROR";
        console.error(`[scan-worker]   Failed: ${errorMsg}`);

        await db.update(scans).set({
          status: "failed",
          errorCode: errorMsg,
          updatedAt: new Date(),
        }).where(eq(scans.id, scan.id));
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[scan-worker] Done in ${elapsed}s — processed ${queuedScans.length} scan(s)`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[scan-worker] Fatal error:", err);
  process.exit(1);
});
