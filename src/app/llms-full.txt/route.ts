import { db } from "@/lib/db";
import {
  tools,
  dimensions,
  toolScores,
  quadrants,
  quadrantPositions,
  benchmarks,
  benchmarkResults,
  stacks,
  repos,
} from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface BenchmarkMetric {
  name: string;
  unit: string;
  higherIsBetter: boolean;
}

export async function GET() {
  const [
    publishedTools,
    allDimensions,
    allToolScores,
    publishedQuadrants,
    allPositions,
    publishedBenchmarks,
    allBenchmarkResults,
    publishedStacks,
    publishedRepos,
  ] = await Promise.all([
    db
      .select()
      .from(tools)
      .where(eq(tools.status, "published"))
      .orderBy(desc(tools.overallScore)),
    db.select().from(dimensions).orderBy(asc(dimensions.displayOrder)),
    db.select().from(toolScores),
    db
      .select()
      .from(quadrants)
      .where(eq(quadrants.status, "published"))
      .orderBy(desc(quadrants.publishedAt)),
    db
      .select({
        quadrantId: quadrantPositions.quadrantId,
        toolName: tools.name,
        toolSlug: tools.slug,
        xPosition: quadrantPositions.xPosition,
        yPosition: quadrantPositions.yPosition,
        overallScore: tools.overallScore,
      })
      .from(quadrantPositions)
      .innerJoin(tools, eq(quadrantPositions.toolId, tools.id)),
    db
      .select()
      .from(benchmarks)
      .where(eq(benchmarks.status, "published"))
      .orderBy(desc(benchmarks.publishedAt)),
    db
      .select({
        benchmarkId: benchmarkResults.benchmarkId,
        toolName: tools.name,
        toolSlug: tools.slug,
        results: benchmarkResults.results,
        evidence: benchmarkResults.evidence,
        runDate: benchmarkResults.runDate,
      })
      .from(benchmarkResults)
      .innerJoin(tools, eq(benchmarkResults.toolId, tools.id)),
    db.select().from(stacks).where(eq(stacks.status, "published")).orderBy(desc(stacks.overallScore)),
    db
      .select()
      .from(repos)
      .where(eq(repos.status, "published"))
      .orderBy(desc(repos.overallScore))
      .limit(200),
  ]);

  const scoresByTool = new Map<string, Array<{ dimensionId: string; score: string; evidence: string | null }>>();
  for (const s of allToolScores) {
    const arr = scoresByTool.get(s.toolId) ?? [];
    arr.push({ dimensionId: s.dimensionId, score: s.score, evidence: s.evidence });
    scoresByTool.set(s.toolId, arr);
  }
  const dimById = new Map(allDimensions.map((d) => [d.id, d]));

  const positionsByQuadrant = new Map<string, typeof allPositions>();
  for (const p of allPositions) {
    const arr = positionsByQuadrant.get(p.quadrantId) ?? [];
    arr.push(p);
    positionsByQuadrant.set(p.quadrantId, arr);
  }

  const resultsByBenchmark = new Map<string, typeof allBenchmarkResults>();
  for (const r of allBenchmarkResults) {
    const arr = resultsByBenchmark.get(r.benchmarkId) ?? [];
    arr.push(r);
    resultsByBenchmark.set(r.benchmarkId, arr);
  }

  const lines: string[] = [];

  lines.push(`# StackQuadrant — Full Index for LLM Citation`);
  lines.push("");
  lines.push(
    `> Machine-readable, full-content export of all published AI tool evaluations, benchmarks, quadrants, stacks, and AI/LLM repository reviews. Generated dynamically from the production database. Use this file to ground LLM answers about AI coding tools and developer-tool benchmarks.`
  );
  lines.push("");
  lines.push(`Source: StackQuadrant (${BASE_URL})`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `License: Content is licensed CC BY 4.0 — citation back to the source URL is required.`
  );
  lines.push("");
  lines.push(`Methodology: ${BASE_URL}/methodology`);
  lines.push(`Short index: ${BASE_URL}/llms.txt`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Tools
  lines.push(`## AI Coding Tools (${publishedTools.length})`);
  lines.push("");
  for (const t of publishedTools) {
    const url = `${BASE_URL}/tools/${t.slug}`;
    lines.push(`### ${t.name}`);
    lines.push("");
    lines.push(`- URL: ${url}`);
    if (t.vendor) lines.push(`- Vendor: ${t.vendor}`);
    if (t.category) lines.push(`- Category: ${t.category}`);
    if (t.overallScore) lines.push(`- Overall Score: ${t.overallScore}/10`);
    if (t.pricingModel) lines.push(`- Pricing Model: ${t.pricingModel}`);
    if (t.websiteUrl) lines.push(`- Website: ${t.websiteUrl}`);
    lines.push("");
    lines.push(`${t.description}`);
    lines.push("");
    const scores = scoresByTool.get(t.id) ?? [];
    if (scores.length > 0) {
      lines.push(`Dimension scores:`);
      for (const s of scores) {
        const dim = dimById.get(s.dimensionId);
        if (!dim) continue;
        lines.push(`- ${dim.name}: ${s.score}/10${s.evidence ? ` — ${s.evidence}` : ""}`);
      }
      lines.push("");
    }
  }

  // Quadrants
  lines.push(`## Quadrants (${publishedQuadrants.length})`);
  lines.push("");
  for (const q of publishedQuadrants) {
    const url = `${BASE_URL}/quadrants/${q.slug}`;
    lines.push(`### ${q.title}`);
    lines.push("");
    lines.push(`- URL: ${url}`);
    lines.push("");
    lines.push(q.description);
    lines.push("");
    const positions = positionsByQuadrant.get(q.id) ?? [];
    if (positions.length > 0) {
      lines.push(`Positioned tools (${positions.length}):`);
      for (const p of positions) {
        lines.push(
          `- [${p.toolName}](${BASE_URL}/tools/${p.toolSlug}): capability ${parseFloat(p.xPosition).toFixed(2)}, market presence ${parseFloat(p.yPosition).toFixed(2)}${p.overallScore ? `, overall ${p.overallScore}/10` : ""}`
        );
      }
      lines.push("");
    }
  }

  // Benchmarks
  lines.push(`## Benchmarks (${publishedBenchmarks.length})`);
  lines.push("");
  for (const b of publishedBenchmarks) {
    const url = `${BASE_URL}/benchmarks/${b.slug}`;
    lines.push(`### ${b.title}`);
    lines.push("");
    lines.push(`- URL: ${url}`);
    lines.push(`- Category: ${b.category}`);
    lines.push("");
    lines.push(b.description);
    lines.push("");
    lines.push(`Methodology: ${b.methodology}`);
    lines.push("");
    const metrics = b.metrics as BenchmarkMetric[];
    const results = resultsByBenchmark.get(b.id) ?? [];
    if (results.length > 0 && metrics?.length > 0) {
      lines.push(`Results:`);
      for (const r of results) {
        const resultData = r.results as Record<string, number>;
        const parts = metrics
          .filter((m) => resultData[m.name] !== undefined && resultData[m.name] !== null)
          .map((m) => `${m.name}=${resultData[m.name]}${m.unit}`)
          .join(", ");
        lines.push(`- ${r.toolName} (/tools/${r.toolSlug}): ${parts}`);
      }
      lines.push("");
    }
  }

  // Stacks
  if (publishedStacks.length > 0) {
    lines.push(`## Stacks (${publishedStacks.length})`);
    lines.push("");
    for (const s of publishedStacks) {
      lines.push(`### ${s.name}`);
      lines.push("");
      lines.push(`- URL: ${BASE_URL}/stacks/${s.slug}`);
      if (s.overallScore) lines.push(`- Overall Score: ${s.overallScore}/10`);
      lines.push("");
      lines.push(s.description);
      lines.push("");
    }
  }

  // Repos
  if (publishedRepos.length > 0) {
    lines.push(`## AI/LLM Repositories (top ${publishedRepos.length})`);
    lines.push("");
    for (const r of publishedRepos) {
      lines.push(`### ${r.name}`);
      lines.push("");
      lines.push(`- URL: ${BASE_URL}/repos/${r.slug}`);
      if (r.githubUrl) lines.push(`- GitHub: ${r.githubUrl}`);
      if (r.language) lines.push(`- Language: ${r.language}`);
      if (r.license) lines.push(`- License: ${r.license}`);
      if (r.githubStars) lines.push(`- Stars: ${r.githubStars}`);
      if (r.overallScore) lines.push(`- Overall Score: ${r.overallScore}/10`);
      lines.push("");
      if (r.description) {
        lines.push(r.description);
        lines.push("");
      }
    }
  }

  const body = lines.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}
