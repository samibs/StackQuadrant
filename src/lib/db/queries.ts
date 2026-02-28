import { db } from "./index";
import { tools, dimensions, toolScores, quadrants, quadrantPositions, benchmarks, benchmarkResults, stacks, stackTools } from "./schema";
import { eq, and, sql, desc, asc, ilike, count } from "drizzle-orm";

export async function getPublishedTools(opts: {
  page: number;
  pageSize: number;
  sort: string;
  search: string;
  category: string;
}) {
  const conditions = [eq(tools.status, "published")];
  if (opts.search) {
    conditions.push(ilike(tools.name, `%${opts.search}%`));
  }
  if (opts.category) {
    conditions.push(eq(tools.category, opts.category));
  }

  const where = and(...conditions);

  const [totalResult] = await db.select({ count: count() }).from(tools).where(where);
  const total = totalResult.count;

  const sortDesc = opts.sort.startsWith("-");
  const sortField = opts.sort.replace(/^-/, "");
  const sortColumn = sortField === "overallScore" ? tools.overallScore
    : sortField === "name" ? tools.name
    : sortField === "category" ? tools.category
    : tools.overallScore;

  const toolList = await db.select().from(tools).where(where)
    .orderBy(sortDesc ? desc(sortColumn) : asc(sortColumn))
    .limit(opts.pageSize)
    .offset((opts.page - 1) * opts.pageSize);

  const allDimensions = await db.select().from(dimensions).orderBy(asc(dimensions.displayOrder));

  const toolIds = toolList.map((t) => t.id);
  const scores = toolIds.length > 0
    ? await db.select().from(toolScores).where(sql`${toolScores.toolId} IN ${toolIds}`)
    : [];

  const enriched = toolList.map((tool) => ({
    ...tool,
    overallScore: tool.overallScore ? parseFloat(tool.overallScore) : null,
    scores: allDimensions.map((dim) => {
      const score = scores.find((s) => s.toolId === tool.id && s.dimensionId === dim.id);
      return {
        dimension: dim.name,
        dimensionSlug: dim.slug,
        dimensionDescription: dim.description,
        dimensionWeight: dim.weight ? parseFloat(dim.weight) : null,
        score: score ? parseFloat(score.score) : null,
      };
    }),
  }));

  return { tools: enriched, total, page: opts.page, pageSize: opts.pageSize };
}

export async function getToolBySlug(slug: string) {
  const [tool] = await db.select().from(tools).where(and(eq(tools.slug, slug), eq(tools.status, "published")));
  if (!tool) return null;

  const allDimensions = await db.select().from(dimensions).orderBy(asc(dimensions.displayOrder));
  const scores = await db.select().from(toolScores).where(eq(toolScores.toolId, tool.id));

  const benchResults = await db.select({
    benchmarkId: benchmarkResults.benchmarkId,
    benchmarkTitle: benchmarks.title,
    results: benchmarkResults.results,
    runDate: benchmarkResults.runDate,
  })
    .from(benchmarkResults)
    .innerJoin(benchmarks, eq(benchmarkResults.benchmarkId, benchmarks.id))
    .where(and(eq(benchmarkResults.toolId, tool.id), eq(benchmarks.status, "published")));

  const stackAppearances = await db.select({
    stackId: stackTools.stackId,
    stackName: stacks.name,
    stackSlug: stacks.slug,
    role: stackTools.role,
    stackScore: stacks.overallScore,
  })
    .from(stackTools)
    .innerJoin(stacks, eq(stackTools.stackId, stacks.id))
    .where(and(eq(stackTools.toolId, tool.id), eq(stacks.status, "published")));

  return {
    ...tool,
    overallScore: tool.overallScore ? parseFloat(tool.overallScore) : null,
    scores: allDimensions.map((dim) => {
      const score = scores.find((s) => s.dimensionId === dim.id);
      return {
        dimension: dim.name,
        dimensionSlug: dim.slug,
        dimensionDescription: dim.description,
        dimensionWeight: dim.weight ? parseFloat(dim.weight) : null,
        score: score ? parseFloat(score.score) : null,
        evidence: score?.evidence || null,
      };
    }),
    benchmarkResults: benchResults.map((r) => ({
      ...r,
      results: r.results as Record<string, number>,
    })),
    stackAppearances: stackAppearances.map((s) => ({
      ...s,
      stackScore: s.stackScore ? parseFloat(s.stackScore) : null,
    })),
  };
}

export async function getPublishedQuadrants() {
  return db.select().from(quadrants).where(eq(quadrants.status, "published")).orderBy(desc(quadrants.publishedAt));
}

export async function getQuadrantBySlug(slug: string) {
  const [quadrant] = await db.select().from(quadrants).where(and(eq(quadrants.slug, slug), eq(quadrants.status, "published")));
  if (!quadrant) return null;

  const positions = await db.select({
    toolId: quadrantPositions.toolId,
    toolName: tools.name,
    toolSlug: tools.slug,
    logoUrl: tools.logoUrl,
    xPosition: quadrantPositions.xPosition,
    yPosition: quadrantPositions.yPosition,
  })
    .from(quadrantPositions)
    .innerJoin(tools, eq(quadrantPositions.toolId, tools.id))
    .where(eq(quadrantPositions.quadrantId, quadrant.id));

  return {
    ...quadrant,
    positions: positions.map((p) => ({
      ...p,
      xPosition: parseFloat(p.xPosition),
      yPosition: parseFloat(p.yPosition),
    })),
  };
}

export async function getPublishedBenchmarks() {
  return db.select().from(benchmarks).where(eq(benchmarks.status, "published")).orderBy(desc(benchmarks.publishedAt));
}

export async function getBenchmarkBySlug(slug: string) {
  const [benchmark] = await db.select().from(benchmarks).where(and(eq(benchmarks.slug, slug), eq(benchmarks.status, "published")));
  if (!benchmark) return null;

  const results = await db.select({
    toolId: benchmarkResults.toolId,
    toolName: tools.name,
    toolSlug: tools.slug,
    results: benchmarkResults.results,
    evidence: benchmarkResults.evidence,
    runDate: benchmarkResults.runDate,
    runBy: benchmarkResults.runBy,
    notes: benchmarkResults.notes,
  })
    .from(benchmarkResults)
    .innerJoin(tools, eq(benchmarkResults.toolId, tools.id))
    .where(eq(benchmarkResults.benchmarkId, benchmark.id));

  return {
    ...benchmark,
    results: results.map((r) => ({
      ...r,
      results: r.results as Record<string, number>,
    })),
  };
}

export async function getPublishedStacks() {
  const stackList = await db.select().from(stacks).where(eq(stacks.status, "published")).orderBy(desc(stacks.overallScore));

  const stackIds = stackList.map((s) => s.id);
  const allStackTools = stackIds.length > 0
    ? await db.select({
        stackId: stackTools.stackId,
        toolId: stackTools.toolId,
        toolName: tools.name,
        toolSlug: tools.slug,
        logoUrl: tools.logoUrl,
        role: stackTools.role,
      })
      .from(stackTools)
      .innerJoin(tools, eq(stackTools.toolId, tools.id))
      .where(sql`${stackTools.stackId} IN ${stackIds}`)
    : [];

  return stackList.map((stack) => ({
    ...stack,
    overallScore: parseFloat(stack.overallScore),
    metrics: stack.metrics as Record<string, number>,
    tools: allStackTools.filter((t) => t.stackId === stack.id),
  }));
}

export async function getStackBySlug(slug: string) {
  const [stack] = await db.select().from(stacks).where(and(eq(stacks.slug, slug), eq(stacks.status, "published")));
  if (!stack) return null;

  const stackToolsList = await db.select({
    toolId: stackTools.toolId,
    toolName: tools.name,
    toolSlug: tools.slug,
    logoUrl: tools.logoUrl,
    role: stackTools.role,
  })
    .from(stackTools)
    .innerJoin(tools, eq(stackTools.toolId, tools.id))
    .where(eq(stackTools.stackId, stack.id));

  return {
    ...stack,
    overallScore: parseFloat(stack.overallScore),
    metrics: stack.metrics as Record<string, number>,
    tools: stackToolsList,
  };
}

export async function getSearchIndex() {
  const publishedTools = await db.select({ id: tools.id, name: tools.name, slug: tools.slug, category: tools.category })
    .from(tools).where(eq(tools.status, "published"));
  const publishedQuadrants = await db.select({ id: quadrants.id, name: quadrants.title, slug: quadrants.slug })
    .from(quadrants).where(eq(quadrants.status, "published"));
  const publishedBenchmarks = await db.select({ id: benchmarks.id, name: benchmarks.title, slug: benchmarks.slug, category: benchmarks.category })
    .from(benchmarks).where(eq(benchmarks.status, "published"));
  const publishedStacks = await db.select({ id: stacks.id, name: stacks.name, slug: stacks.slug, useCase: stacks.useCase })
    .from(stacks).where(eq(stacks.status, "published"));

  return [
    ...publishedTools.map((t) => ({ ...t, type: "tool" as const })),
    ...publishedQuadrants.map((q) => ({ ...q, type: "quadrant" as const, category: undefined })),
    ...publishedBenchmarks.map((b) => ({ ...b, type: "benchmark" as const })),
    ...publishedStacks.map((s) => ({ id: s.id, name: s.name, slug: s.slug, type: "stack" as const, category: s.useCase })),
  ];
}
