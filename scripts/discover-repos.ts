/**
 * Discover AI/LLM Repos via GitHub Search API
 * Searches for popular repositories across 10 AI/LLM categories, deduplicates
 * against existing entries, inserts new ones, and syncs GitHub metrics.
 *
 * Usage: npx tsx scripts/discover-repos.ts
 * Schedule: PM2 cron weekly (Sunday 3am)
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// Inline schema (avoid importing Next.js app code)
const repoCategories = pgTable("repo_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 200 }).notNull(),
});

const repos = pgTable("repos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull(),
  description: text("description").notNull(),
  githubOwner: varchar("github_owner", { length: 200 }).notNull(),
  githubRepo: varchar("github_repo", { length: 200 }).notNull(),
  githubUrl: varchar("github_url", { length: 500 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  categoryId: uuid("category_id").notNull(),
  license: varchar("license", { length: 100 }),
  language: varchar("language", { length: 100 }),
  tags: jsonb("tags").default([]),
  status: varchar("status", { length: 20 }).notNull().default("published"),
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// GitHub API helpers
const GITHUB_API = "https://api.github.com";
let rateLimitRemaining = 60;
let searchRateLimitRemaining = 10;

async function githubFetch(path: string): Promise<Response> {
  if (rateLimitRemaining < 5) {
    console.warn(`[discover] Core rate limit near (${rateLimitRemaining}), pausing 60s...`);
    await new Promise((r) => setTimeout(r, 60000));
  }
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "StackQuadrant/1.0",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  const rem = res.headers.get("x-ratelimit-remaining");
  if (rem) rateLimitRemaining = parseInt(rem, 10);
  return res;
}

async function githubSearchFetch(query: string): Promise<Response> {
  if (searchRateLimitRemaining < 2) {
    console.warn(`[discover] Search rate limit near (${searchRateLimitRemaining}), pausing 60s...`);
    await new Promise((r) => setTimeout(r, 60000));
  }
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "StackQuadrant/1.0",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  const rem = res.headers.get("x-ratelimit-remaining");
  if (rem) searchRateLimitRemaining = parseInt(rem, 10);
  return res;
}

async function fetchMetrics(owner: string, repo: string) {
  const res = await githubFetch(`/repos/${owner}/${repo}`);
  if (!res.ok) { console.error(`  Metrics failed: ${res.status}`); return null; }
  const d = await res.json();

  // Contributors
  let contributors = 0;
  const cRes = await githubFetch(`/repos/${owner}/${repo}/contributors?per_page=1&anon=true`);
  if (cRes.ok) {
    const link = cRes.headers.get("link");
    if (link) { const m = link.match(/page=(\d+)>;\s*rel="last"/); contributors = m ? parseInt(m[1], 10) : 1; }
    else { const cd = await cRes.json(); contributors = Array.isArray(cd) ? cd.length : 0; }
  }

  // Latest release
  let lastRelease: string | null = null;
  let releaseDate: Date | null = null;
  const rRes = await githubFetch(`/repos/${owner}/${repo}/releases/latest`);
  if (rRes.ok) { const rd = await rRes.json(); lastRelease = rd.tag_name || null; releaseDate = rd.published_at ? new Date(rd.published_at) : null; }

  // Weekly commits
  let weeklyCommits = 0;
  const wRes = await githubFetch(`/repos/${owner}/${repo}/stats/commit_activity`);
  if (wRes.ok) { const wd = await wRes.json(); if (Array.isArray(wd) && wd.length > 0) weeklyCommits = wd[wd.length - 1]?.total || 0; }

  return {
    stars: d.stargazers_count || 0,
    forks: d.forks_count || 0,
    openIssues: d.open_issues_count || 0,
    watchers: d.subscribers_count || 0,
    contributors,
    language: d.language || null,
    license: d.license?.spdx_id || null,
    lastCommit: d.pushed_at ? new Date(d.pushed_at) : null,
    createdAt: d.created_at ? new Date(d.created_at) : null,
    lastRelease,
    releaseDate,
    weeklyCommits,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 280);
}

// Category → search queries mapping
const CATEGORY_QUERIES: Record<string, string> = {
  "llm-frameworks": "topic:llm topic:framework stars:>500",
  "agent-frameworks": "topic:ai-agent OR topic:agent-framework stars:>300",
  "rag-libraries": "topic:rag OR topic:retrieval-augmented-generation stars:>200",
  "vector-databases": "topic:vector-database OR topic:vector-search stars:>200",
  "inference-engines": "topic:llm-inference OR topic:model-serving stars:>300",
  "fine-tuning": "topic:fine-tuning OR topic:llm-training stars:>200",
  "prompt-engineering": "topic:prompt-engineering OR topic:prompt-optimization stars:>200",
  "ai-devops": "topic:mlops OR topic:llmops stars:>200",
  "model-serving": "topic:model-serving OR topic:inference-server stars:>200",
  "evaluation-testing": "topic:llm-evaluation OR topic:ai-testing stars:>100",
};

async function main() {
  console.log("[discover] Starting repo discovery...\n");

  if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client);

  // Load category map
  const cats = await db.select().from(repoCategories);
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  let totalDiscovered = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalSynced = 0;

  for (const [categorySlug, query] of Object.entries(CATEGORY_QUERIES)) {
    const categoryId = catMap.get(categorySlug);
    if (!categoryId) {
      console.warn(`  [skip] Category "${categorySlug}" not found in DB`);
      continue;
    }

    console.log(`\n[${categorySlug}] Searching: ${query}`);
    const res = await githubSearchFetch(query);

    if (!res.ok) {
      console.error(`  Search failed: ${res.status} ${res.statusText}`);
      if (res.status === 403) {
        console.warn("  Rate limited, pausing 60s...");
        await new Promise((r) => setTimeout(r, 60000));
      }
      continue;
    }

    const data = await res.json();
    const items = data.items || [];
    console.log(`  Found ${items.length} repos (total_count: ${data.total_count})`);
    totalDiscovered += items.length;

    for (const item of items) {
      const owner = item.owner?.login;
      const repoName = item.name;
      if (!owner || !repoName) continue;

      // Check if already exists
      const [existing] = await db.select({ id: repos.id }).from(repos)
        .where(and(eq(repos.githubOwner, owner), eq(repos.githubRepo, repoName)));

      if (existing) {
        totalSkipped++;
        continue;
      }

      const slug = slugify(repoName);

      // Check slug collision
      const [slugExists] = await db.select({ id: repos.id }).from(repos).where(eq(repos.slug, slug));
      const finalSlug = slugExists ? slugify(`${owner}-${repoName}`) : slug;

      // Insert
      const [row] = await db.insert(repos).values({
        name: item.full_name || repoName,
        slug: finalSlug,
        description: (item.description || `${repoName} — open-source AI/LLM project.`).slice(0, 1000),
        githubOwner: owner,
        githubRepo: repoName,
        githubUrl: item.html_url || `https://github.com/${owner}/${repoName}`,
        websiteUrl: item.homepage || null,
        categoryId,
        tags: item.topics?.slice(0, 10) || [],
        status: "published",
        language: item.language || null,
        license: item.license?.spdx_id || null,
        githubStars: item.stargazers_count || 0,
        githubForks: item.forks_count || 0,
        githubOpenIssues: item.open_issues_count || 0,
        githubWatchers: item.subscribers_count || item.watchers_count || 0,
        githubCreatedAt: item.created_at ? new Date(item.created_at) : null,
        githubLastCommit: item.pushed_at ? new Date(item.pushed_at) : null,
      }).returning();

      totalInserted++;
      console.log(`  [+] ${owner}/${repoName} (★${(item.stargazers_count || 0).toLocaleString()})`);

      // Sync full metrics
      console.log(`      Syncing metrics... (rate limit: ${rateLimitRemaining})`);
      const metrics = await fetchMetrics(owner, repoName);
      if (metrics) {
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
          license: metrics.license,
          updatedAt: new Date(),
        }).where(eq(repos.id, row.id));
        totalSynced++;
      }

      // 1s delay between metric fetches
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 2s delay between search queries to respect search rate limit
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n[discover] Done — discovered: ${totalDiscovered}, inserted: ${totalInserted}, synced: ${totalSynced}, skipped: ${totalSkipped}`);
  console.log(`[discover] Rate limits remaining — core: ${rateLimitRemaining}, search: ${searchRateLimitRemaining}`);
  await client.end();
}

main().catch((err) => { console.error("[discover] Fatal:", err); process.exit(1); });
