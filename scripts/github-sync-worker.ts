/**
 * GitHub Sync Worker
 * Standalone script that syncs GitHub metrics for all repos in the database.
 * Designed to be run via PM2 cron (every 6 hours).
 *
 * Usage: npx tsx scripts/github-sync-worker.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

// Inline minimal schema to avoid importing Next.js app code
const repoCategories = pgTable("repo_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
});

const repos = pgTable("repos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 300 }).notNull(),
  githubOwner: varchar("github_owner", { length: 200 }).notNull(),
  githubRepo: varchar("github_repo", { length: 200 }).notNull(),
  githubStars: integer("github_stars"),
  githubForks: integer("github_forks"),
  githubOpenIssues: integer("github_open_issues"),
  githubWatchers: integer("github_watchers"),
  githubContributors: integer("github_contributors"),
  githubLastCommit: timestamp("github_last_commit", { withTimezone: true }),
  githubCreatedAt: timestamp("github_created_at", { withTimezone: true }),
  githubLastRelease: varchar("github_last_release", { length: 200 }),
  githubReleaseDate: timestamp("github_release_date", { withTimezone: true }),
  githubWeeklyCommits: integer("github_weekly_commits"),
  githubSyncedAt: timestamp("github_synced_at", { withTimezone: true }),
  language: varchar("language", { length: 100 }),
  license: varchar("license", { length: 100 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// GitHub API helpers
const GITHUB_API = "https://api.github.com";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "StackQuadrant/1.0",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

let rateLimitRemaining = 5000;
let rateLimitReset = 0;

async function githubFetch(path: string): Promise<Response> {
  if (rateLimitRemaining < 10) {
    const waitMs = Math.max(0, (rateLimitReset * 1000) - Date.now() + 1000);
    if (waitMs > 0 && waitMs < 3600000) {
      console.log(`[sync] Rate limit near (${rateLimitRemaining} remaining), waiting ${Math.round(waitMs / 1000)}s`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const res = await fetch(`${GITHUB_API}${path}`, { headers: getHeaders() });

  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  if (remaining) rateLimitRemaining = parseInt(remaining, 10);
  if (reset) rateLimitReset = parseInt(reset, 10);

  return res;
}

interface RepoMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  contributors: number;
  language: string | null;
  license: string | null;
  lastCommit: Date | null;
  createdAt: Date | null;
  lastRelease: string | null;
  releaseDate: Date | null;
  weeklyCommits: number;
}

async function fetchAllMetrics(owner: string, repo: string): Promise<RepoMetrics | null> {
  // Basic repo data
  const res = await githubFetch(`/repos/${owner}/${repo}`);
  if (!res.ok) {
    console.error(`[sync] Failed to fetch ${owner}/${repo}: ${res.status}`);
    return null;
  }
  const data = await res.json();

  // Contributors count
  let contributors = 0;
  const contribRes = await githubFetch(`/repos/${owner}/${repo}/contributors?per_page=1&anon=true`);
  if (contribRes.ok) {
    const link = contribRes.headers.get("link");
    if (link) {
      const match = link.match(/page=(\d+)>;\s*rel="last"/);
      contributors = match ? parseInt(match[1], 10) : 1;
    } else {
      const contribData = await contribRes.json();
      contributors = Array.isArray(contribData) ? contribData.length : 0;
    }
  }

  // Latest release
  let lastRelease: string | null = null;
  let releaseDate: Date | null = null;
  const releaseRes = await githubFetch(`/repos/${owner}/${repo}/releases/latest`);
  if (releaseRes.ok) {
    const releaseData = await releaseRes.json();
    lastRelease = releaseData.tag_name || null;
    releaseDate = releaseData.published_at ? new Date(releaseData.published_at) : null;
  }

  // Weekly commits
  let weeklyCommits = 0;
  const commitRes = await githubFetch(`/repos/${owner}/${repo}/stats/commit_activity`);
  if (commitRes.ok) {
    const commitData = await commitRes.json();
    if (Array.isArray(commitData) && commitData.length > 0) {
      weeklyCommits = commitData[commitData.length - 1]?.total || 0;
    }
  }

  return {
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    openIssues: data.open_issues_count || 0,
    watchers: data.subscribers_count || 0,
    contributors,
    language: data.language || null,
    license: data.license?.spdx_id || null,
    lastCommit: data.pushed_at ? new Date(data.pushed_at) : null,
    createdAt: data.created_at ? new Date(data.created_at) : null,
    lastRelease,
    releaseDate,
    weeklyCommits,
  };
}

async function main() {
  const startTime = Date.now();
  console.log(`[sync] GitHub sync worker starting at ${new Date().toISOString()}`);

  if (!process.env.DATABASE_URL) {
    console.error("[sync] DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client);

  try {
    const allRepos = await db.select({
      id: repos.id,
      name: repos.name,
      githubOwner: repos.githubOwner,
      githubRepo: repos.githubRepo,
    }).from(repos);

    console.log(`[sync] Found ${allRepos.length} repos to sync`);

    let synced = 0;
    let failed = 0;

    for (const repo of allRepos) {
      if (rateLimitRemaining < 20) {
        console.warn(`[sync] Rate limit too low (${rateLimitRemaining}), stopping`);
        break;
      }

      try {
        const metrics = await fetchAllMetrics(repo.githubOwner, repo.githubRepo);
        if (!metrics) {
          failed++;
          continue;
        }

        await db.update(repos).set({
          githubStars: metrics.stars,
          githubForks: metrics.forks,
          githubOpenIssues: metrics.openIssues,
          githubWatchers: metrics.watchers,
          githubContributors: metrics.contributors,
          githubLastCommit: metrics.lastCommit,
          githubCreatedAt: metrics.createdAt,
          githubLastRelease: metrics.lastRelease,
          githubReleaseDate: metrics.releaseDate,
          githubWeeklyCommits: metrics.weeklyCommits,
          githubSyncedAt: new Date(),
          language: metrics.language,
          updatedAt: new Date(),
        }).where(eq(repos.id, repo.id));

        synced++;
        console.log(`[sync] ✓ ${repo.name} (${repo.githubOwner}/${repo.githubRepo}) — ★${metrics.stars}`);

        // 500ms delay between repos
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        failed++;
        console.error(`[sync] ✗ ${repo.name}: ${err instanceof Error ? err.message : err}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[sync] Done in ${elapsed}s — synced: ${synced}, failed: ${failed}, rate limit remaining: ${rateLimitRemaining}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[sync] Fatal error:", err);
  process.exit(1);
});
