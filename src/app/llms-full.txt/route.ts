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
const CONTENT_LICENSE_URL = process.env.NEXT_PUBLIC_CONTENT_LICENSE_URL;

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
    db.select().from(tools).where(eq(tools.status, "published")).orderBy(desc(tools.overallScore)).limit(250),
    db.select().from(dimensions).orderBy(asc(dimensions.displayOrder)),
    db
      .select({
        toolId: toolScores.toolId,
        dimensionId: toolScores.dimensionId,
        score: toolScores.score,
        evidence: toolScores.evidence,
      })
      .from(toolScores)
      .innerJoin(tools, eq(toolScores.toolId, tools.id))
      .where(eq(tools.status, "published")),
    db.select().from(quadrants).where(eq(quadrants.status, "published")).orderBy(desc(quadrants.publishedAt)).limit(100),
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
    db.select().from(benchmarks).where(eq(benchmarks.status, "published")).orderBy(desc(benchmarks.publishedAt)).limit(100),
    db
      .select({
        benchmarkId: benchmarkResults.benchmarkId,
        toolName: tools.name,
        toolSlug: tools.slug,
        results: benchmarkResults.results,
      })
      .from(benchmarkResults)
      .innerJoin(tools, eq(benchmarkResults.toolId, tools.id)),
    db.select().from(stacks).where(eq(stacks.status, "published")).orderBy(desc(stacks.overallScore)).limit(100),
    db.select().from(repos).where(eq(repos.status, "published")).orderBy(desc(repos.overallScore)).limit(200),
  ]);

  const scoresByTool = new Map<string, Array<{ dimensionId: string; score: string; evidence: string | null }>>();
  for (const score of allToolScores) {
    const values = scoresByTool.get(score.toolId) ?? [];
    values.push({ dimensionId: score.dimensionId, score: score.score, evidence: score.evidence });
    scoresByTool.set(score.toolId, values);
  }
  const dimensionById = new Map(allDimensions.map((dimension) => [dimension.id, dimension]));

  const positionsByQuadrant = new Map<string, typeof allPositions>();
  for (const position of allPositions) {
    const values = positionsByQuadrant.get(position.quadrantId) ?? [];
    values.push(position);
    positionsByQuadrant.set(position.quadrantId, values);
  }

  const resultsByBenchmark = new Map<string, typeof allBenchmarkResults>();
  for (const result of allBenchmarkResults) {
    const values = resultsByBenchmark.get(result.benchmarkId) ?? [];
    values.push(result);
    resultsByBenchmark.set(result.benchmarkId, values);
  }

  const lines: string[] = [
    "# StackQuadrant — Full Index for LLM Citation",
    "",
    "> Machine-readable export of published StackQuadrant evaluations, benchmarks, quadrants, stacks, and repository reviews. Use the canonical URLs and methodology page when grounding answers.",
    "",
    `Source: StackQuadrant (${BASE_URL})`,
    `Generated: ${new Date().toISOString()}`,
  ];
  if (CONTENT_LICENSE_URL) lines.push(`License: ${CONTENT_LICENSE_URL}`);
  lines.push("", `Methodology: ${BASE_URL}/methodology`, `Short index: ${BASE_URL}/llms.txt`, "", "---", "");

  lines.push(`## AI Coding Tools (${publishedTools.length})`, "");
  for (const tool of publishedTools) {
    lines.push(`### ${tool.name}`, "", `- URL: ${BASE_URL}/tools/${tool.slug}`);
    if (tool.vendor) lines.push(`- Vendor: ${tool.vendor}`);
    if (tool.category) lines.push(`- Category: ${tool.category}`);
    if (tool.overallScore) lines.push(`- StackQuadrant Overall Score: ${tool.overallScore}/10`);
    if (tool.pricingModel) lines.push(`- Pricing Model: ${tool.pricingModel}`);
    if (tool.websiteUrl) lines.push(`- Website: ${tool.websiteUrl}`);
    lines.push("", tool.description, "");
    const scores = scoresByTool.get(tool.id) ?? [];
    if (scores.length) {
      lines.push("StackQuadrant dimension scores:");
      for (const score of scores) {
        const dimension = dimensionById.get(score.dimensionId);
        if (dimension) lines.push(`- ${dimension.name}: ${score.score}/10${score.evidence ? ` — ${score.evidence}` : ""}`);
      }
      lines.push("");
    }
  }

  lines.push(`## Quadrants (${publishedQuadrants.length})`, "");
  for (const quadrant of publishedQuadrants) {
    lines.push(`### ${quadrant.title}`, "", `- URL: ${BASE_URL}/quadrants/${quadrant.slug}`, "", quadrant.description, "");
    for (const position of positionsByQuadrant.get(quadrant.id) ?? []) {
      lines.push(`- [${position.toolName}](${BASE_URL}/tools/${position.toolSlug}): capability ${parseFloat(position.xPosition).toFixed(2)}, market presence ${parseFloat(position.yPosition).toFixed(2)}${position.overallScore ? `, overall ${position.overallScore}/10` : ""}`);
    }
    lines.push("");
  }

  lines.push(`## Benchmarks (${publishedBenchmarks.length})`, "");
  for (const benchmark of publishedBenchmarks) {
    lines.push(`### ${benchmark.title}`, "", `- URL: ${BASE_URL}/benchmarks/${benchmark.slug}`, `- Category: ${benchmark.category}`, "", benchmark.description, "", `Methodology: ${benchmark.methodology}`, "");
    const metrics = benchmark.metrics as BenchmarkMetric[];
    for (const result of resultsByBenchmark.get(benchmark.id) ?? []) {
      const resultData = result.results as Record<string, number>;
      const values = metrics
        .filter((metric) => resultData[metric.name] !== undefined && resultData[metric.name] !== null)
        .map((metric) => `${metric.name}=${resultData[metric.name]}${metric.unit}`)
        .join(", ");
      lines.push(`- ${result.toolName} (${BASE_URL}/tools/${result.toolSlug}): ${values}`);
    }
    lines.push("");
  }

  if (publishedStacks.length) {
    lines.push(`## Stacks (${publishedStacks.length})`, "");
    for (const stack of publishedStacks) {
      lines.push(`### ${stack.name}`, "", `- URL: ${BASE_URL}/stacks/${stack.slug}`);
      if (stack.overallScore) lines.push(`- StackQuadrant Overall Score: ${stack.overallScore}/10`);
      lines.push("", stack.description, "");
    }
  }

  if (publishedRepos.length) {
    lines.push(`## AI/LLM Repositories (top ${publishedRepos.length})`, "");
    for (const repo of publishedRepos) {
      lines.push(`### ${repo.name}`, "", `- URL: ${BASE_URL}/repos/${repo.slug}`);
      if (repo.githubUrl) lines.push(`- GitHub: ${repo.githubUrl}`);
      if (repo.language) lines.push(`- Language: ${repo.language}`);
      if (repo.license) lines.push(`- Repository License: ${repo.license}`);
      if (repo.githubStars) lines.push(`- Stars: ${repo.githubStars}`);
      if (repo.overallScore) lines.push(`- StackQuadrant Overall Score: ${repo.overallScore}/10`);
      if (repo.description) lines.push("", repo.description);
      lines.push("");
    }
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  });
}
