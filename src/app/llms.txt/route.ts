import { db } from "@/lib/db";
import { tools, quadrants, benchmarks, stacks, repos, repoCategories } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { BEST_FOR_CATEGORIES } from "@/lib/db/queries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";
export const revalidate = 3600;

export async function GET() {
  const [publishedTools, publishedQuadrants, publishedBenchmarks, publishedStacks, publishedRepos, publishedRepoCategories] = await Promise.all([
    db.select({ name: tools.name, slug: tools.slug, description: tools.description, vendor: tools.vendor, category: tools.category, overallScore: tools.overallScore }).from(tools).where(eq(tools.status, "published")).orderBy(desc(tools.overallScore)).limit(250),
    db.select({ title: quadrants.title, slug: quadrants.slug, description: quadrants.description }).from(quadrants).where(eq(quadrants.status, "published")).orderBy(desc(quadrants.publishedAt)).limit(100),
    db.select({ title: benchmarks.title, slug: benchmarks.slug, description: benchmarks.description, category: benchmarks.category }).from(benchmarks).where(eq(benchmarks.status, "published")).orderBy(desc(benchmarks.publishedAt)).limit(100),
    db.select({ name: stacks.name, slug: stacks.slug, description: stacks.description, overallScore: stacks.overallScore }).from(stacks).where(eq(stacks.status, "published")).orderBy(desc(stacks.overallScore)).limit(100),
    db.select({ name: repos.name, slug: repos.slug, description: repos.description, language: repos.language, overallScore: repos.overallScore, githubStars: repos.githubStars }).from(repos).where(eq(repos.status, "published")).orderBy(desc(repos.overallScore)).limit(100),
    db.select({ name: repoCategories.name, slug: repoCategories.slug, description: repoCategories.description }).from(repoCategories).orderBy(asc(repoCategories.displayOrder)),
  ]);

  const sections: string[] = [
    "# StackQuadrant",
    "",
    "> StackQuadrant publishes data-driven evaluations of AI coding tools, AI-related open-source repositories, technology stacks, and head-to-head benchmark results. Scores are StackQuadrant editorial/evaluation outputs on a 0–10 scale across weighted dimensions.",
    "",
    "This index follows the llms.txt convention for machine-readable discovery. Retrieval-oriented agents may access public content subject to robots.txt. Training/general-ingestion crawler policy is intentionally managed separately.",
    "",
    `- Full machine-readable index: [${BASE_URL}/llms-full.txt](${BASE_URL}/llms-full.txt)`,
    `- XML sitemap: [${BASE_URL}/sitemap.xml](${BASE_URL}/sitemap.xml)`,
    "- Detail pages expose Schema.org JSON-LD without treating score dimensions as independent user reviews.",
    "",
  ];

  if (publishedTools.length) {
    sections.push("## AI Coding Tools", "");
    for (const tool of publishedTools) {
      const score = tool.overallScore ? ` (StackQuadrant score ${tool.overallScore}/10)` : "";
      const vendor = tool.vendor ? ` — by ${tool.vendor}` : "";
      sections.push(`- [${tool.name}${score}](${BASE_URL}/tools/${tool.slug}): ${tool.description}${vendor}`);
    }
    sections.push("");
  }

  if (publishedQuadrants.length) {
    sections.push("## Quadrants (Market Positioning)", "");
    for (const quadrant of publishedQuadrants) sections.push(`- [${quadrant.title}](${BASE_URL}/quadrants/${quadrant.slug}): ${quadrant.description.substring(0, 200)}`);
    sections.push("");
  }

  if (publishedBenchmarks.length) {
    sections.push("## Benchmarks", "");
    for (const benchmark of publishedBenchmarks) sections.push(`- [${benchmark.title}](${BASE_URL}/benchmarks/${benchmark.slug}): ${benchmark.description} (category: ${benchmark.category})`);
    sections.push("");
  }

  if (publishedStacks.length) {
    sections.push("## Stacks", "");
    for (const stack of publishedStacks) {
      const score = stack.overallScore ? ` (StackQuadrant score ${stack.overallScore}/10)` : "";
      sections.push(`- [${stack.name}${score}](${BASE_URL}/stacks/${stack.slug}): ${stack.description}`);
    }
    sections.push("");
  }

  if (publishedRepos.length) {
    sections.push("## AI/LLM Repositories", "");
    for (const repo of publishedRepos) {
      const score = repo.overallScore ? ` (StackQuadrant score ${repo.overallScore}/10)` : "";
      const stars = repo.githubStars ? `, ★${repo.githubStars}` : "";
      const lang = repo.language ? `, ${repo.language}` : "";
      sections.push(`- [${repo.name}${score}](${BASE_URL}/repos/${repo.slug}): ${repo.description ?? ""}${stars}${lang}`);
    }
    sections.push("");
  }

  if (publishedRepoCategories.length) {
    sections.push("## Repository Categories", "");
    for (const category of publishedRepoCategories) sections.push(`- [${category.name}](${BASE_URL}/repos/categories/${category.slug}): ${category.description ?? `Repositories in the ${category.name} category`}`);
    sections.push("");
  }

  sections.push("## Best-For Categories", "");
  for (const category of BEST_FOR_CATEGORIES) sections.push(`- [Best AI Tools for ${category.label}](${BASE_URL}/best-for/${category.slug}): ${category.description}`);
  sections.push("", "## Methodology & Reference", "", `- [Methodology](${BASE_URL}/methodology): How tools and repos are scored.`, `- [Help](${BASE_URL}/help): Glossary and FAQ.`, `- [Matrix](${BASE_URL}/matrix): Interactive comparison across all tools.`, "");

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  });
}
