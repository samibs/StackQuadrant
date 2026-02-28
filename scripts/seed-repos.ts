/**
 * Seed AI/LLM Repos
 * Inserts a curated list of popular AI/LLM repositories and syncs GitHub metrics.
 *
 * Usage: npx tsx scripts/seed-repos.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { pgTable, uuid, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

// Inline schema
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

// GitHub API (unauthenticated)
const GITHUB_API = "https://api.github.com";
let rateLimitRemaining = 60;

async function githubFetch(path: string): Promise<Response> {
  if (rateLimitRemaining < 5) {
    console.warn(`[seed] Rate limit near (${rateLimitRemaining}), pausing 60s...`);
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

async function fetchMetrics(owner: string, repo: string) {
  const res = await githubFetch(`/repos/${owner}/${repo}`);
  if (!res.ok) { console.error(`  Failed: ${res.status}`); return null; }
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

// Curated repo list — top AI/LLM repos per category
const REPOS = [
  // LLM Frameworks
  { name: "LangChain", slug: "langchain", owner: "langchain-ai", repo: "langchain", url: "https://github.com/langchain-ai/langchain", website: "https://langchain.com", category: "llm-frameworks", tags: ["python", "llm", "chains", "agents"] },
  { name: "LlamaIndex", slug: "llamaindex", owner: "run-llama", repo: "llama_index", url: "https://github.com/run-llama/llama_index", website: "https://llamaindex.ai", category: "llm-frameworks", tags: ["python", "rag", "data-framework"] },
  { name: "Ollama", slug: "ollama", owner: "ollama", repo: "ollama", url: "https://github.com/ollama/ollama", website: "https://ollama.com", category: "llm-frameworks", tags: ["go", "local-llm", "inference"] },

  // Agent Frameworks
  { name: "AutoGen", slug: "autogen", owner: "microsoft", repo: "autogen", url: "https://github.com/microsoft/autogen", website: "https://microsoft.github.io/autogen", category: "agent-frameworks", tags: ["python", "multi-agent", "microsoft"] },
  { name: "CrewAI", slug: "crewai", owner: "crewAIInc", repo: "crewAI", url: "https://github.com/crewAIInc/crewAI", website: "https://crewai.com", category: "agent-frameworks", tags: ["python", "agents", "orchestration"] },

  // RAG Libraries
  { name: "Haystack", slug: "haystack", owner: "deepset-ai", repo: "haystack", url: "https://github.com/deepset-ai/haystack", website: "https://haystack.deepset.ai", category: "rag-libraries", tags: ["python", "rag", "pipelines", "search"] },

  // Vector Databases
  { name: "Qdrant", slug: "qdrant", owner: "qdrant", repo: "qdrant", url: "https://github.com/qdrant/qdrant", website: "https://qdrant.tech", category: "vector-databases", tags: ["rust", "vector-db", "similarity-search"] },
  { name: "Milvus", slug: "milvus", owner: "milvus-io", repo: "milvus", url: "https://github.com/milvus-io/milvus", website: "https://milvus.io", category: "vector-databases", tags: ["go", "vector-db", "cloud-native"] },

  // Inference Engines
  { name: "vLLM", slug: "vllm", owner: "vllm-project", repo: "vllm", url: "https://github.com/vllm-project/vllm", website: "https://vllm.ai", category: "inference-engines", tags: ["python", "inference", "high-throughput"] },
  { name: "llama.cpp", slug: "llama-cpp", owner: "ggml-org", repo: "llama.cpp", url: "https://github.com/ggml-org/llama.cpp", website: null, category: "inference-engines", tags: ["cpp", "local-inference", "quantization"] },

  // Fine-tuning Tools
  { name: "Unsloth", slug: "unsloth", owner: "unslothai", repo: "unsloth", url: "https://github.com/unslothai/unsloth", website: "https://unsloth.ai", category: "fine-tuning", tags: ["python", "fine-tuning", "efficient"] },

  // Prompt Engineering
  { name: "DSPy", slug: "dspy", owner: "stanfordnlp", repo: "dspy", url: "https://github.com/stanfordnlp/dspy", website: "https://dspy.ai", category: "prompt-engineering", tags: ["python", "prompt-programming", "stanford"] },

  // AI DevOps
  { name: "LiteLLM", slug: "litellm", owner: "BerriAI", repo: "litellm", url: "https://github.com/BerriAI/litellm", website: "https://litellm.ai", category: "ai-devops", tags: ["python", "proxy", "api-gateway", "multi-provider"] },

  // Model Serving
  { name: "TensorRT-LLM", slug: "tensorrt-llm", owner: "NVIDIA", repo: "TensorRT-LLM", url: "https://github.com/NVIDIA/TensorRT-LLM", website: null, category: "model-serving", tags: ["python", "nvidia", "tensorrt", "optimization"] },

  // Evaluation & Testing
  { name: "Ragas", slug: "ragas", owner: "explodinggradients", repo: "ragas", url: "https://github.com/explodinggradients/ragas", website: "https://ragas.io", category: "evaluation-testing", tags: ["python", "rag-evaluation", "metrics"] },

  // Our Projects
  { name: "StackQuadrant", slug: "stackquadrant", owner: "samibs", repo: "StackQuadrant", url: "https://github.com/samibs/StackQuadrant", website: "https://stackquadrant.com", category: "ai-devops", tags: ["nextjs", "ai-tools", "evaluation", "intelligence-platform"] },
  { name: "SkillFoundry", slug: "skillfoundry", owner: "samibs", repo: "skillfoundry", url: "https://github.com/samibs/skillfoundry", website: null, category: "ai-devops", tags: ["ai", "framework", "development", "workflow"] },
];

async function main() {
  console.log("[seed] Starting repo seeding...\n");

  if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client);

  // Load category map
  const cats = await db.select().from(repoCategories);
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  let inserted = 0;
  let synced = 0;
  let skipped = 0;

  for (const r of REPOS) {
    const categoryId = catMap.get(r.category);
    if (!categoryId) { console.error(`  Category "${r.category}" not found, skipping ${r.name}`); skipped++; continue; }

    // Check if already exists
    const [existing] = await db.select({ id: repos.id }).from(repos).where(eq(repos.slug, r.slug));
    if (existing) { console.log(`  [skip] ${r.name} already exists`); skipped++; continue; }

    // Insert
    const [row] = await db.insert(repos).values({
      name: r.name,
      slug: r.slug,
      description: `${r.name} — a leading open-source project in the AI/LLM ecosystem.`,
      githubOwner: r.owner,
      githubRepo: r.repo,
      githubUrl: r.url,
      websiteUrl: r.website,
      categoryId,
      tags: r.tags,
      status: "published",
    }).returning();

    inserted++;
    console.log(`  [+] ${r.name} (${r.owner}/${r.repo})`);

    // Sync GitHub metrics
    console.log(`      Syncing GitHub metrics... (rate limit: ${rateLimitRemaining})`);
    const metrics = await fetchMetrics(r.owner, r.repo);
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

      synced++;
      console.log(`      ★ ${metrics.stars.toLocaleString()} | ◇ ${metrics.forks.toLocaleString()} | ${metrics.language || "?"} | ${metrics.license || "?"}`);
    }

    // 1s delay between repos to respect rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n[seed] Done — inserted: ${inserted}, synced: ${synced}, skipped: ${skipped}, rate limit remaining: ${rateLimitRemaining}`);
  await client.end();
}

main().catch((err) => { console.error("[seed] Fatal:", err); process.exit(1); });
