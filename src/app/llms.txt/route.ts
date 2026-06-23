import { db } from "@/lib/db";
import {
  tools,
  quadrants,
  benchmarks,
  stacks,
  repos,
  repoCategories,
} from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { BEST_FOR_CATEGORIES } from "@/lib/db/queries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const [
    publishedTools,
    publishedQuadrants,
    publishedBenchmarks,
    publishedStacks,
    publishedRepos,
    publishedRepoCategories,
  ] = await Promise.all([
    db
      .select({
        name: tools.name,
        slug: tools.slug,
        description: tools.description,
        vendor: tools.vendor,
        category: tools.category,
        overallScore: tools.overallScore,
      })
      .from(tools)
      .where(eq(tools.status, "published"))
      .orderBy(desc(tools.overallScore)),
    db
      .select({
        title: quadrants.title,
        slug: quadrants.slug,
        description: quadrants.description,
      })
      .from(quadrants)
      .where(eq(quadrants.status, "published"))
      .orderBy(desc(quadrants.publishedAt)),
    db
      .select({
        title: benchmarks.title,
        slug: benchmarks.slug,
        description: benchmarks.description,
        category: benchmarks.category,
      })
      .from(benchmarks)
      .where(eq(benchmarks.status, "published"))
      .orderBy(desc(benchmarks.publishedAt)),
    db
      .select({
        name: stacks.name,
        slug: stacks.slug,
        description: stacks.description,
        overallScore: stacks.overallScore,
      })
      .from(stacks)
      .where(eq(stacks.status, "published"))
      .orderBy(desc(stacks.overallScore)),
    db
      .select({
        name: repos.name,
        slug: repos.slug,
        description: repos.description,
        language: repos.language,
        overallScore: repos.overallScore,
        githubStars: repos.githubStars,
      })
      .from(repos)
      .where(eq(repos.status, "published"))
      .orderBy(desc(repos.overallScore)),
    db
      .select({ name: repoCategories.name, slug: repoCategories.slug, description: repoCategories.description })
      .from(repoCategories)
      .orderBy(asc(repoCategories.displayOrder)),
  ]);

  const sections: string[] = [];

  sections.push(`# StackQuadrant`);
  sections.push("");
  sections.push(
    `> StackQuadrant publishes data-driven evaluations of AI coding tools, AI-related open-source repositories, technology stacks, and head-to-head benchmark results. All scoring uses a 0–10 scale across multiple weighted dimensions including code generation, context understanding, developer experience, multi-file editing, debugging, and ecosystem integration. Content is structured for LLM citation: every entity is reachable via a canonical URL with JSON-LD metadata.`
  );
  sections.push("");
  sections.push(
    `This index is published per the [llms.txt](https://llmstxt.org) convention. Crawlers (GPTBot, PerplexityBot, ClaudeBot, ChatGPT-User, Google-Extended, CCBot) are permitted via robots.txt and may cite this content with attribution to StackQuadrant.`
  );
  sections.push("");
  sections.push(
    `- Full machine-readable index: [${BASE_URL}/llms-full.txt](${BASE_URL}/llms-full.txt)`
  );
  sections.push(`- XML sitemap: [${BASE_URL}/sitemap.xml](${BASE_URL}/sitemap.xml)`);
  sections.push(
    `- Each detail page exposes Schema.org JSON-LD (SoftwareApplication, SoftwareSourceCode, Dataset, CollectionPage, BreadcrumbList).`
  );
  sections.push("");

  if (publishedTools.length > 0) {
    sections.push(`## AI Coding Tools`);
    sections.push("");
    for (const t of publishedTools) {
      const score = t.overallScore ? ` (score ${t.overallScore}/10)` : "";
      const vendor = t.vendor ? ` — by ${t.vendor}` : "";
      sections.push(
        `- [${t.name}${score}](${BASE_URL}/tools/${t.slug}): ${t.description}${vendor}`
      );
    }
    sections.push("");
  }

  if (publishedQuadrants.length > 0) {
    sections.push(`## Quadrants (Market Positioning)`);
    sections.push("");
    for (const q of publishedQuadrants) {
      sections.push(
        `- [${q.title}](${BASE_URL}/quadrants/${q.slug}): ${q.description.substring(0, 200)}`
      );
    }
    sections.push("");
  }

  if (publishedBenchmarks.length > 0) {
    sections.push(`## Benchmarks`);
    sections.push("");
    for (const b of publishedBenchmarks) {
      sections.push(
        `- [${b.title}](${BASE_URL}/benchmarks/${b.slug}): ${b.description} (category: ${b.category})`
      );
    }
    sections.push("");
  }

  if (publishedStacks.length > 0) {
    sections.push(`## Stacks`);
    sections.push("");
    for (const s of publishedStacks) {
      const score = s.overallScore ? ` (score ${s.overallScore}/10)` : "";
      sections.push(`- [${s.name}${score}](${BASE_URL}/stacks/${s.slug}): ${s.description}`);
    }
    sections.push("");
  }

  if (publishedRepos.length > 0) {
    sections.push(`## AI/LLM Repositories`);
    sections.push("");
    for (const r of publishedRepos.slice(0, 100)) {
      const score = r.overallScore ? ` (score ${r.overallScore}/10)` : "";
      const stars = r.githubStars ? `, ★${r.githubStars}` : "";
      const lang = r.language ? `, ${r.language}` : "";
      sections.push(
        `- [${r.name}${score}](${BASE_URL}/repos/${r.slug}): ${r.description ?? ""}${stars}${lang}`
      );
    }
    if (publishedRepos.length > 100) {
      sections.push(
        `- … and ${publishedRepos.length - 100} more — see ${BASE_URL}/repos`
      );
    }
    sections.push("");
  }

  if (publishedRepoCategories.length > 0) {
    sections.push(`## Repository Categories`);
    sections.push("");
    for (const c of publishedRepoCategories) {
      sections.push(
        `- [${c.name}](${BASE_URL}/repos/categories/${c.slug}): ${c.description ?? `Repositories in the ${c.name} category`}`
      );
    }
    sections.push("");
  }

  sections.push(`## Best-For Categories`);
  sections.push("");
  for (const cat of BEST_FOR_CATEGORIES) {
    sections.push(
      `- [Best AI Tools for ${cat.label}](${BASE_URL}/best-for/${cat.slug}): ${cat.description}`
    );
  }
  sections.push("");

  sections.push(`## Methodology & Reference`);
  sections.push("");
  sections.push(`- [Methodology](${BASE_URL}/methodology): How tools and repos are scored.`);
  sections.push(`- [Help](${BASE_URL}/help): Glossary and FAQ.`);
  sections.push(`- [Matrix](${BASE_URL}/matrix): Interactive comparison across all tools.`);
  sections.push("");

  const body = sections.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}
