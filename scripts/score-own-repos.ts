import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

// Inline schema (standalone script — no Next.js imports)
const repos = pgTable("repos", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  overallScore: numeric("overall_score", { precision: 4, scale: 1 }),
  updatedAt: timestamp("updated_at"),
});

const repoDimensions = pgTable("repo_dimensions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  weight: numeric("weight", { precision: 3, scale: 2 }).notNull(),
});

const repoScores = pgTable("repo_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  repoId: uuid("repo_id").notNull(),
  dimensionId: uuid("dimension_id").notNull(),
  score: numeric("score", { precision: 4, scale: 1 }).notNull(),
  evidence: text("evidence"),
  evaluatedAt: timestamp("evaluated_at"),
  evaluatedBy: varchar("evaluated_by", { length: 200 }),
});

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ── Manual scores for our projects ──────────────────────────────────

interface RepoScoreSet {
  slug: string;
  scores: Record<string, { score: number; evidence: string }>;
}

const OUR_REPOS: RepoScoreSet[] = [
  {
    slug: "stackquadrant",
    scores: {
      "documentation-quality": {
        score: 8.5,
        evidence:
          "Comprehensive README with full API reference, project structure, scoring methodology. In-app /help page with interactive guide. /methodology page with transparent evaluation criteria. CONTRIBUTING.md and CODE_OF_CONDUCT.md. CHANGELOG.md with full version history. Score: 8.5/10",
      },
      "community-health": {
        score: 6.0,
        evidence:
          "Open-source MIT license. Community showcase submission system with email verification. Contributing guidelines in place. GitHub Issues enabled. PRs welcome. Early-stage project building community. Score: 6.0/10",
      },
      "maintenance-velocity": {
        score: 8.8,
        evidence:
          "Active daily development with 50+ commits. Regular releases (v1.0 → v2.0 → v2.1 in rapid succession). Automated GitHub sync every 6h. Weekly repo discovery cron. PM2 process management. Score: 8.8/10",
      },
      "api-design-dx": {
        score: 8.2,
        evidence:
          "Full REST API with 30+ endpoints. Consistent response format with correlationId. TypeScript throughout. Drizzle ORM with type-safe queries. Server Components by default. Command palette (Cmd+K) search. Dark/light theme. Responsive from mobile to ultrawide. Score: 8.2/10",
      },
      "production-readiness": {
        score: 8.0,
        evidence:
          "Live production deployment at stackquadrant.com. SSL/TLS via Let's Encrypt. Nginx reverse proxy. PM2 process management with cron scheduling. JWT authentication for admin. Rate limiting on submissions. Input validation. Security headers (CSP, HSTS, X-Frame-Options). Health check endpoint. Score: 8.0/10",
      },
      "ecosystem-integration": {
        score: 7.5,
        evidence:
          "GitHub REST API integration for metrics sync and auto-discovery. Zoho SMTP email integration. SEO with JSON-LD structured data and sitemap. GitHub Actions CI/CD workflows. PM2 ecosystem config. Docker Compose support. Newsletter subscription system. Score: 7.5/10",
      },
    },
  },
  {
    slug: "skillfoundry",
    scores: {
      "documentation-quality": {
        score: 7.0,
        evidence:
          "Framework documentation with setup guides. CLAUDE.md with comprehensive development instructions. Genesis workflow documented. Multi-agent architecture explained. PRD template included. Score: 7.0/10",
      },
      "community-health": {
        score: 5.0,
        evidence:
          "Open-source project. Early-stage framework building initial user base. Development-focused community around AI-assisted coding practices. Score: 5.0/10",
      },
      "maintenance-velocity": {
        score: 7.5,
        evidence:
          "Active development with regular commits. Framework evolving with new agent types and capabilities. PRD-first development workflow ensures structured progress. Score: 7.5/10",
      },
      "api-design-dx": {
        score: 7.8,
        evidence:
          "Structured agent architecture with clear separation of concerns. Slash command system for developer interaction. Memory bank for persistent context. Three-layer enforcement (DB → Backend → Frontend). TypeScript-first. Score: 7.8/10",
      },
      "production-readiness": {
        score: 6.5,
        evidence:
          "Framework designed for production AI-assisted development. Autonomous mode with intent classification. Security guidelines enforced. Zero-tolerance policy for placeholder code. Session lifecycle management. Score: 6.5/10",
      },
      "ecosystem-integration": {
        score: 7.0,
        evidence:
          "Integrates with Claude Code CLI. GitHub knowledge sync daemon. Multi-project support. Compatible with standard Node.js/TypeScript toolchains. PM2 process management support. Score: 7.0/10",
      },
    },
  },
];

async function main() {
  console.log("==> Scoring our own projects with manual evaluations\n");

  // Load dimensions
  const dims = await db.select().from(repoDimensions);
  const dimMap = new Map(dims.map((d) => [d.slug, d]));

  for (const repoData of OUR_REPOS) {
    const [repo] = await db
      .select()
      .from(repos)
      .where(eq(repos.slug, repoData.slug));
    if (!repo) {
      console.log(`  ✗ Repo "${repoData.slug}" not found, skipping`);
      continue;
    }

    console.log(`  ${repo.name} (${repo.slug})`);

    let totalWeight = 0;
    let weightedSum = 0;

    for (const [dimSlug, scoreData] of Object.entries(repoData.scores)) {
      const dim = dimMap.get(dimSlug);
      if (!dim) {
        console.log(`    ✗ Dimension "${dimSlug}" not found`);
        continue;
      }

      // Check for existing score
      const existing = await db
        .select()
        .from(repoScores)
        .where(
          and(
            eq(repoScores.repoId, repo.id),
            eq(repoScores.dimensionId, dim.id)
          )
        );

      if (existing.length > 0) {
        await db
          .update(repoScores)
          .set({
            score: scoreData.score.toFixed(1),
            evidence: scoreData.evidence,
            evaluatedAt: new Date(),
            evaluatedBy: "manual-evaluation",
          })
          .where(eq(repoScores.id, existing[0].id));
      } else {
        await db.insert(repoScores).values({
          repoId: repo.id,
          dimensionId: dim.id,
          score: scoreData.score.toFixed(1),
          evidence: scoreData.evidence,
          evaluatedBy: "manual-evaluation",
        });
      }

      const w = parseFloat(dim.weight);
      weightedSum += scoreData.score * w;
      totalWeight += w;

      console.log(
        `    ${dim.name}: ${scoreData.score.toFixed(1)} (w: ${dim.weight})`
      );
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    await db
      .update(repos)
      .set({
        overallScore: overallScore.toFixed(1),
        updatedAt: new Date(),
      })
      .where(eq(repos.id, repo.id));

    console.log(`    ── Overall: ${overallScore.toFixed(1)}/10\n`);
  }

  console.log("==> Done");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
