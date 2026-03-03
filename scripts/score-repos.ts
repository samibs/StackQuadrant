/**
 * Auto-Score Repos — GitHub Metrics-Based Quality Scoring
 *
 * Derives quality scores across 6 dimensions from GitHub metrics data.
 * Uses a transparent, reproducible methodology based on percentile ranking
 * within the dataset. Scores are written to repo_scores and overall_score
 * is recalculated as a weighted average.
 *
 * Methodology:
 *   Each dimension maps to specific GitHub metrics. Raw metrics are converted
 *   to a 0-10 scale using logarithmic normalization against configurable
 *   thresholds (calibrated to the AI/LLM ecosystem). The final dimension
 *   score is a weighted blend of its constituent signals.
 *
 * Usage: npx tsx scripts/score-repos.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { pgTable, uuid, varchar, text, decimal, integer, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Inline schema
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
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const repoDimensions = pgTable("repo_dimensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull(),
  displayOrder: integer("display_order").notNull(),
});

const repoScores = pgTable("repo_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoId: uuid("repo_id").notNull(),
  dimensionId: uuid("dimension_id").notNull(),
  score: decimal("score", { precision: 3, scale: 1 }).notNull(),
  evidence: text("evidence"),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  evaluatedBy: varchar("evaluated_by", { length: 200 }).notNull(),
});

// ─── Scoring Functions ───────────────────────────────────────────────────────

/** Logarithmic normalization: maps a raw value to 0-10 given min/max thresholds */
function logNorm(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 10;
  const logVal = Math.log1p(value - min);
  const logMax = Math.log1p(max - min);
  return Math.round((logVal / logMax) * 100) / 10; // round to 1 decimal
}

/** Linear normalization: maps a raw value to 0-10 given min/max thresholds */
function linNorm(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  if (value >= max) return 10;
  return Math.round(((value - min) / (max - min)) * 100) / 10;
}

/** Clamp score to 0-10 */
function clamp(score: number): number {
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

/** Days since a date */
function daysSince(d: Date | null): number {
  if (!d) return 9999;
  return Math.max(0, (Date.now() - d.getTime()) / 86400000);
}

/** Freshness score: recent = high, old = low */
function freshness(d: Date | null, goodDays: number, badDays: number): number {
  const days = daysSince(d);
  if (days <= goodDays) return 10;
  if (days >= badDays) return 0;
  return Math.round(((badDays - days) / (badDays - goodDays)) * 100) / 10;
}

interface RepoData {
  id: string;
  name: string;
  slug: string;
  description: string;
  githubOwner: string;
  githubStars: number;
  githubForks: number;
  githubOpenIssues: number;
  githubWatchers: number;
  githubContributors: number;
  githubLastCommit: Date | null;
  githubCreatedAt: Date | null;
  githubLastRelease: string | null;
  githubReleaseDate: Date | null;
  githubWeeklyCommits: number;
  websiteUrl: string | null;
  license: string | null;
  language: string | null;
}

// ─── Dimension Scorers ───────────────────────────────────────────────────────
// Each function returns { score: number, evidence: string }

function scoreDocumentation(r: RepoData): { score: number; evidence: string } {
  const signals: string[] = [];
  let total = 0;
  let count = 0;

  // Has dedicated website/docs (strong signal)
  const hasDocs = r.websiteUrl && r.websiteUrl.length > 5;
  const docsScore = hasDocs ? 8.0 : 3.0;
  signals.push(hasDocs ? `Has docs site (${r.websiteUrl})` : "No dedicated docs site");
  total += docsScore * 2; count += 2; // weight x2

  // Description quality (length as proxy)
  const descLen = (r.description || "").length;
  const descScore = descLen > 200 ? 8.0 : descLen > 80 ? 6.0 : descLen > 30 ? 4.0 : 2.0;
  signals.push(`Description: ${descLen} chars`);
  total += descScore; count += 1;

  // Stars as proxy for doc quality (popular projects tend to have better docs)
  const starsDocScore = logNorm(r.githubStars, 100, 30000);
  signals.push(`Stars signal: ${r.githubStars.toLocaleString()}`);
  total += starsDocScore * 1.5; count += 1.5;

  // Contributors (more contributors = more doc contributions)
  const contribDocScore = logNorm(r.githubContributors, 5, 500);
  signals.push(`Contributors: ${r.githubContributors}`);
  total += contribDocScore; count += 1;

  const score = clamp(total / count);
  return { score, evidence: `${signals.join(". ")}. Score: ${score}/10` };
}

function scoreCommunityHealth(r: RepoData): { score: number; evidence: string } {
  const signals: string[] = [];
  let total = 0;
  let count = 0;

  // Stars (community size)
  const starsScore = logNorm(r.githubStars, 50, 50000);
  signals.push(`Stars: ${r.githubStars.toLocaleString()}`);
  total += starsScore * 2; count += 2;

  // Contributors (diversity)
  const contribScore = logNorm(r.githubContributors, 3, 300);
  signals.push(`Contributors: ${r.githubContributors}`);
  total += contribScore * 2; count += 2;

  // Watchers (engaged followers)
  const watchScore = logNorm(r.githubWatchers, 10, 1000);
  signals.push(`Watchers: ${r.githubWatchers}`);
  total += watchScore; count += 1;

  // Forks (active community engagement)
  const forkScore = logNorm(r.githubForks, 20, 10000);
  signals.push(`Forks: ${r.githubForks.toLocaleString()}`);
  total += forkScore; count += 1;

  // Issue health: ratio of open issues to stars (lower = healthier)
  if (r.githubStars > 100) {
    const issueRatio = r.githubOpenIssues / r.githubStars;
    const issueScore = issueRatio < 0.01 ? 9.0 : issueRatio < 0.03 ? 7.5 : issueRatio < 0.06 ? 6.0 : issueRatio < 0.1 ? 4.5 : 3.0;
    signals.push(`Issue ratio: ${(issueRatio * 100).toFixed(1)}%`);
    total += issueScore; count += 1;
  }

  const score = clamp(total / count);
  return { score, evidence: `${signals.join(". ")}. Score: ${score}/10` };
}

function scoreMaintenanceVelocity(r: RepoData): { score: number; evidence: string } {
  const signals: string[] = [];
  let total = 0;
  let count = 0;

  // Last commit freshness (critical signal)
  const commitFresh = freshness(r.githubLastCommit, 7, 365);
  const commitDays = Math.round(daysSince(r.githubLastCommit));
  signals.push(`Last commit: ${commitDays}d ago`);
  total += commitFresh * 3; count += 3; // heavy weight

  // Weekly commits
  const weeklyScore = r.githubWeeklyCommits >= 20 ? 9.0
    : r.githubWeeklyCommits >= 10 ? 8.0
    : r.githubWeeklyCommits >= 5 ? 7.0
    : r.githubWeeklyCommits >= 2 ? 5.5
    : r.githubWeeklyCommits >= 1 ? 4.0 : 2.0;
  signals.push(`Weekly commits: ${r.githubWeeklyCommits}`);
  total += weeklyScore * 2; count += 2;

  // Has releases (versioned delivery)
  const hasRelease = !!r.githubLastRelease;
  const releaseFresh = freshness(r.githubReleaseDate, 30, 365);
  if (hasRelease) {
    signals.push(`Latest release: ${r.githubLastRelease}`);
    total += releaseFresh * 1.5; count += 1.5;
  } else {
    signals.push("No releases published");
    total += 2.0; count += 1.5;
  }

  // Repo age (maturity bonus — older active repos score higher)
  const ageYears = daysSince(r.githubCreatedAt) / 365;
  const ageBonus = ageYears > 3 ? 1.0 : ageYears > 1 ? 0.5 : 0;
  if (ageBonus > 0) {
    signals.push(`Maturity bonus: ${ageYears.toFixed(1)}y old`);
    total += ageBonus; // small additive bonus, no count increase
  }

  const score = clamp(total / count);
  return { score, evidence: `${signals.join(". ")}. Score: ${score}/10` };
}

function scoreApiDesignDx(r: RepoData): { score: number; evidence: string } {
  const signals: string[] = [];
  let total = 0;
  let count = 0;

  // Stars-to-open-issues ratio (good DX = fewer complaints relative to users)
  if (r.githubStars > 100) {
    const ratio = r.githubStars / Math.max(1, r.githubOpenIssues);
    const dxScore = ratio > 100 ? 9.0 : ratio > 50 ? 8.0 : ratio > 20 ? 7.0 : ratio > 10 ? 5.5 : 4.0;
    signals.push(`Stars/issues ratio: ${ratio.toFixed(0)}`);
    total += dxScore * 2; count += 2;
  }

  // Language type-safety bonus
  const typedLangs = ["TypeScript", "Rust", "Go", "Kotlin", "Swift", "C#", "Java", "Scala"];
  const dynamicLangs = ["Python", "JavaScript", "Ruby", "PHP"];
  if (typedLangs.includes(r.language || "")) {
    signals.push(`Typed language: ${r.language}`);
    total += 8.0; count += 1;
  } else if (dynamicLangs.includes(r.language || "")) {
    signals.push(`Dynamic language: ${r.language}`);
    total += 6.0; count += 1;
  } else {
    total += 5.0; count += 1;
  }

  // Has website (API docs accessibility)
  const hasDocs = r.websiteUrl && r.websiteUrl.length > 5;
  total += hasDocs ? 8.0 : 4.0; count += 1;
  signals.push(hasDocs ? "Has documentation site" : "No dedicated API docs");

  // License (permissive = better DX, developer-friendly)
  const permissive = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense"];
  if (r.license && permissive.includes(r.license)) {
    signals.push(`Permissive license: ${r.license}`);
    total += 8.5; count += 1;
  } else if (r.license) {
    signals.push(`License: ${r.license}`);
    total += 6.0; count += 1;
  } else {
    signals.push("No license specified");
    total += 3.0; count += 1;
  }

  // Popularity as proxy for good DX
  const popScore = logNorm(r.githubStars, 200, 40000);
  signals.push(`Popularity signal: ${r.githubStars.toLocaleString()} stars`);
  total += popScore; count += 1;

  const score = clamp(total / count);
  return { score, evidence: `${signals.join(". ")}. Score: ${score}/10` };
}

function scoreProductionReadiness(r: RepoData): { score: number; evidence: string } {
  const signals: string[] = [];
  let total = 0;
  let count = 0;

  // Battle-tested (stars = real-world usage)
  const battleScore = logNorm(r.githubStars, 500, 30000);
  signals.push(`Battle-tested: ${r.githubStars.toLocaleString()} stars`);
  total += battleScore * 2; count += 2;

  // Many contributors (peer review, security)
  const peerScore = logNorm(r.githubContributors, 10, 500);
  signals.push(`Peer review: ${r.githubContributors} contributors`);
  total += peerScore * 1.5; count += 1.5;

  // Has versioned releases (production delivery)
  const hasRelease = !!r.githubLastRelease;
  total += hasRelease ? 8.0 : 3.0; count += 1.5;
  signals.push(hasRelease ? `Versioned: ${r.githubLastRelease}` : "No versioned releases");

  // License (required for production)
  if (r.license) {
    signals.push(`Licensed: ${r.license}`);
    total += 8.0; count += 1;
  } else {
    signals.push("No license (risky for production)");
    total += 1.0; count += 1;
  }

  // Maturity (age of repo)
  const ageYears = daysSince(r.githubCreatedAt) / 365;
  const ageScore = ageYears > 4 ? 9.0 : ageYears > 2 ? 7.5 : ageYears > 1 ? 6.0 : ageYears > 0.5 ? 4.0 : 2.0;
  signals.push(`Age: ${ageYears.toFixed(1)} years`);
  total += ageScore; count += 1;

  // Active maintenance (not abandoned)
  const maintenanceScore = freshness(r.githubLastCommit, 14, 180);
  signals.push(`Maintenance: last commit ${Math.round(daysSince(r.githubLastCommit))}d ago`);
  total += maintenanceScore; count += 1;

  const score = clamp(total / count);
  return { score, evidence: `${signals.join(". ")}. Score: ${score}/10` };
}

function scoreEcosystemIntegration(r: RepoData): { score: number; evidence: string } {
  const signals: string[] = [];
  let total = 0;
  let count = 0;

  // Forks (integration/extension interest)
  const forkScore = logNorm(r.githubForks, 50, 5000);
  signals.push(`Fork interest: ${r.githubForks.toLocaleString()}`);
  total += forkScore * 1.5; count += 1.5;

  // Language ecosystem popularity
  const majorEcosystems = ["Python", "TypeScript", "JavaScript", "Go", "Rust", "Java"];
  if (majorEcosystems.includes(r.language || "")) {
    signals.push(`Major ecosystem: ${r.language}`);
    total += 8.0; count += 1;
  } else if (r.language) {
    signals.push(`Ecosystem: ${r.language}`);
    total += 5.0; count += 1;
  } else {
    total += 3.0; count += 1;
  }

  // License (permissive = easier integration)
  const permissive = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"];
  if (r.license && permissive.includes(r.license)) {
    signals.push(`Integration-friendly: ${r.license}`);
    total += 9.0; count += 1;
  } else if (r.license) {
    signals.push(`License: ${r.license}`);
    total += 5.5; count += 1;
  } else {
    signals.push("No license (integration risk)");
    total += 2.0; count += 1;
  }

  // Community size (broader adoption = more integrations)
  const adoptionScore = logNorm(r.githubStars, 200, 20000);
  signals.push(`Adoption: ${r.githubStars.toLocaleString()} stars`);
  total += adoptionScore; count += 1;

  // Has website (ecosystem presence)
  if (r.websiteUrl) {
    signals.push("Has web presence");
    total += 7.0; count += 1;
  }

  const score = clamp(total / count);
  return { score, evidence: `${signals.join(". ")}. Score: ${score}/10` };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[score] Starting auto-scoring of repos...\n");

  if (!process.env.DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client);

  // Load dimensions
  const dims = await db.select().from(repoDimensions);
  const dimMap = new Map(dims.map((d) => [d.slug, d]));

  const DIMENSION_SCORERS: Record<string, (r: RepoData) => { score: number; evidence: string }> = {
    "documentation-quality": scoreDocumentation,
    "community-health": scoreCommunityHealth,
    "maintenance-velocity": scoreMaintenanceVelocity,
    "api-design-dx": scoreApiDesignDx,
    "production-readiness": scoreProductionReadiness,
    "ecosystem-integration": scoreEcosystemIntegration,
  };

  // Load all repos
  const allRepos = await db.select().from(repos);
  console.log(`[score] Found ${allRepos.length} repos to score\n`);

  let scored = 0;

  for (const repo of allRepos) {
    const r: RepoData = {
      id: repo.id,
      name: repo.name,
      slug: repo.slug,
      description: repo.description,
      githubOwner: repo.githubOwner,
      githubStars: repo.githubStars || 0,
      githubForks: repo.githubForks || 0,
      githubOpenIssues: repo.githubOpenIssues || 0,
      githubWatchers: repo.githubWatchers || 0,
      githubContributors: repo.githubContributors || 0,
      githubLastCommit: repo.githubLastCommit,
      githubCreatedAt: repo.githubCreatedAt,
      githubLastRelease: repo.githubLastRelease,
      githubReleaseDate: repo.githubReleaseDate,
      githubWeeklyCommits: repo.githubWeeklyCommits || 0,
      websiteUrl: repo.websiteUrl,
      license: repo.license,
      language: repo.language,
    };

    console.log(`[${repo.slug}] ${repo.name}`);

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dimSlug, scorer] of Object.entries(DIMENSION_SCORERS)) {
      const dim = dimMap.get(dimSlug);
      if (!dim) { console.warn(`  Dimension ${dimSlug} not found, skipping`); continue; }

      const result = scorer(r);
      const weight = parseFloat(dim.weight);

      // Upsert score
      const [existing] = await db.select({ id: repoScores.id }).from(repoScores)
        .where(sql`${repoScores.repoId} = ${repo.id} AND ${repoScores.dimensionId} = ${dim.id}`);

      if (existing) {
        await db.update(repoScores).set({
          score: result.score.toFixed(1),
          evidence: result.evidence,
          evaluatedAt: new Date(),
          evaluatedBy: "auto-scorer",
        }).where(eq(repoScores.id, existing.id));
      } else {
        await db.insert(repoScores).values({
          repoId: repo.id,
          dimensionId: dim.id,
          score: result.score.toFixed(1),
          evidence: result.evidence,
          evaluatedBy: "auto-scorer",
        });
      }

      weightedSum += result.score * weight;
      totalWeight += weight;

      console.log(`  ${dim.name}: ${result.score}/10 (w: ${(weight * 100).toFixed(0)}%)`);
    }

    // Calculate and store overall score
    const overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;
    await db.update(repos).set({
      overallScore: overallScore !== null ? overallScore.toFixed(1) : null,
      updatedAt: new Date(),
    }).where(eq(repos.id, repo.id));

    console.log(`  Overall: ${overallScore}/10\n`);
    scored++;
  }

  console.log(`[score] Done — scored ${scored} repos`);
  await client.end();
}

main().catch((err) => { console.error("[score] Fatal:", err); process.exit(1); });
