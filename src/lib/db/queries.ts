import { db } from "./index";
import { tools, dimensions, toolScores, quadrants, quadrantPositions, benchmarks, benchmarkResults, stacks, stackTools, blogPosts, scoreHistory, overallScoreHistory, repos, repoCategories, repoDimensions, repoScores, showcaseProjects, showcaseToolLinks } from "./schema";
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

  const scoreMap = new Map<string, typeof scores[number]>();
  for (const s of scores) {
    scoreMap.set(`${s.toolId}:${s.dimensionId}`, s);
  }

  const enriched = toolList.map((tool) => ({
    ...tool,
    overallScore: tool.overallScore ? parseFloat(tool.overallScore) : null,
    scores: allDimensions.map((dim) => {
      const score = scoreMap.get(`${tool.id}:${dim.id}`);
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

  const scoreByDim = new Map<string, typeof scores[number]>();
  for (const s of scores) {
    scoreByDim.set(s.dimensionId, s);
  }

  return {
    ...tool,
    overallScore: tool.overallScore ? parseFloat(tool.overallScore) : null,
    scores: allDimensions.map((dim) => {
      const score = scoreByDim.get(dim.id);
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
    overallScore: tools.overallScore,
    category: tools.category,
    xPosition: quadrantPositions.xPosition,
    yPosition: quadrantPositions.yPosition,
  })
    .from(quadrantPositions)
    .innerJoin(tools, eq(quadrantPositions.toolId, tools.id))
    .where(eq(quadrantPositions.quadrantId, quadrant.id));

  // Fetch dimension scores for all positioned tools
  const toolIds = positions.map((p) => p.toolId);
  const allDims = await db.select().from(dimensions).orderBy(asc(dimensions.displayOrder));
  const allScores = toolIds.length > 0
    ? await db.select().from(toolScores).where(sql`${toolScores.toolId} IN ${toolIds}`)
    : [];
  const scoreMap = new Map<string, typeof allScores[number]>();
  for (const s of allScores) {
    scoreMap.set(`${s.toolId}:${s.dimensionId}`, s);
  }

  return {
    ...quadrant,
    positions: positions.map((p) => ({
      ...p,
      overallScore: p.overallScore ? parseFloat(p.overallScore) : null,
      xPosition: parseFloat(p.xPosition),
      yPosition: parseFloat(p.yPosition),
      scores: allDims.map((dim) => {
        const score = scoreMap.get(`${p.toolId}:${dim.id}`);
        return {
          dimension: dim.name,
          score: score ? parseFloat(score.score) : null,
        };
      }),
    })),
  };
}

export async function getPublishedBenchmarks() {
  const benchmarkList = await db.select().from(benchmarks).where(eq(benchmarks.status, "published")).orderBy(desc(benchmarks.publishedAt));

  const benchmarkIds = benchmarkList.map((b) => b.id);
  const allResults = benchmarkIds.length > 0
    ? await db.select({
        benchmarkId: benchmarkResults.benchmarkId,
        toolName: tools.name,
        results: benchmarkResults.results,
      })
      .from(benchmarkResults)
      .innerJoin(tools, eq(benchmarkResults.toolId, tools.id))
      .where(sql`${benchmarkResults.benchmarkId} IN ${benchmarkIds}`)
    : [];

  const resultsByBenchmark = new Map<string, typeof allResults>();
  for (const r of allResults) {
    const existing = resultsByBenchmark.get(r.benchmarkId) || [];
    existing.push(r);
    resultsByBenchmark.set(r.benchmarkId, existing);
  }

  return benchmarkList.map((b) => {
    const results = resultsByBenchmark.get(b.id) || [];
    const metrics = b.metrics as Array<{ name: string; unit: string; higherIsBetter: boolean }> | null;
    let topTool: string | null = null;
    if (results.length > 0 && metrics && metrics.length > 0) {
      const primaryMetric = metrics[0];
      const sorted = [...results].sort((a, b) => {
        const aVal = (a.results as Record<string, number>)[primaryMetric.name] || 0;
        const bVal = (b.results as Record<string, number>)[primaryMetric.name] || 0;
        return primaryMetric.higherIsBetter ? bVal - aVal : aVal - bVal;
      });
      topTool = sorted[0]?.toolName || null;
    }
    return { ...b, topTool, participantCount: results.length };
  });
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

  const toolsByStack = new Map<string, typeof allStackTools>();
  for (const t of allStackTools) {
    const existing = toolsByStack.get(t.stackId) || [];
    existing.push(t);
    toolsByStack.set(t.stackId, existing);
  }

  return stackList.map((stack) => ({
    ...stack,
    overallScore: parseFloat(stack.overallScore),
    metrics: stack.metrics as Record<string, number>,
    tools: toolsByStack.get(stack.id) || [],
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

export async function getToolsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const toolList = await db.select().from(tools)
    .where(and(eq(tools.status, "published"), sql`${tools.slug} IN ${slugs}`));
  if (toolList.length === 0) return [];

  const allDimensions = await db.select().from(dimensions).orderBy(asc(dimensions.displayOrder));
  const toolIds = toolList.map((t) => t.id);
  const scores = await db.select().from(toolScores).where(sql`${toolScores.toolId} IN ${toolIds}`);

  const compareScoreMap = new Map<string, typeof scores[number]>();
  for (const s of scores) {
    compareScoreMap.set(`${s.toolId}:${s.dimensionId}`, s);
  }

  return toolList.map((tool) => ({
    ...tool,
    overallScore: tool.overallScore ? parseFloat(tool.overallScore) : null,
    tags: (tool.tags || []) as string[],
    scores: allDimensions.map((dim) => {
      const score = compareScoreMap.get(`${tool.id}:${dim.id}`);
      return {
        dimension: dim.name,
        dimensionSlug: dim.slug,
        score: score ? parseFloat(score.score) : null,
      };
    }),
  }));
}

export async function getAllPublishedToolSlugs() {
  const result = await db.select({ name: tools.name, slug: tools.slug }).from(tools)
    .where(eq(tools.status, "published")).orderBy(asc(tools.name));
  return result;
}

export async function getSearchIndex() {
  const [publishedTools, publishedQuadrants, publishedBenchmarks, publishedStacks, publishedRepos, publishedShowcase] = await Promise.all([
    db.select({ id: tools.id, name: tools.name, slug: tools.slug, category: tools.category })
      .from(tools).where(eq(tools.status, "published")),
    db.select({ id: quadrants.id, name: quadrants.title, slug: quadrants.slug })
      .from(quadrants).where(eq(quadrants.status, "published")),
    db.select({ id: benchmarks.id, name: benchmarks.title, slug: benchmarks.slug, category: benchmarks.category })
      .from(benchmarks).where(eq(benchmarks.status, "published")),
    db.select({ id: stacks.id, name: stacks.name, slug: stacks.slug, useCase: stacks.useCase })
      .from(stacks).where(eq(stacks.status, "published")),
    db.select({ id: repos.id, name: repos.name, slug: repos.slug })
      .from(repos).where(eq(repos.status, "published")),
    db.select({ id: showcaseProjects.id, name: showcaseProjects.name, slug: showcaseProjects.slug })
      .from(showcaseProjects).where(eq(showcaseProjects.status, "published")),
  ]);

  return [
    ...publishedTools.map((t) => ({ ...t, type: "tool" as const })),
    ...publishedQuadrants.map((q) => ({ ...q, type: "quadrant" as const, category: undefined })),
    ...publishedBenchmarks.map((b) => ({ ...b, type: "benchmark" as const })),
    ...publishedStacks.map((s) => ({ id: s.id, name: s.name, slug: s.slug, type: "stack" as const, category: s.useCase })),
    ...publishedRepos.map((r) => ({ ...r, type: "repo" as const, category: undefined })),
    ...publishedShowcase.map((p) => ({ ...p, type: "showcase" as const, category: undefined })),
  ];
}

export async function getRecentlyUpdatedTools(limit: number = 3) {
  const result = await db.select({
    id: tools.id,
    name: tools.name,
    slug: tools.slug,
    overallScore: tools.overallScore,
    updatedAt: tools.updatedAt,
    category: tools.category,
  }).from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.updatedAt))
    .limit(limit);
  return result.map((t) => ({
    ...t,
    overallScore: t.overallScore ? parseFloat(t.overallScore) : null,
  }));
}

export async function getQuadrantWithPositions() {
  const [quadrant] = await db.select().from(quadrants)
    .where(eq(quadrants.status, "published"))
    .orderBy(desc(quadrants.publishedAt))
    .limit(1);
  if (!quadrant) return null;

  const positions = await db.select({
    toolId: quadrantPositions.toolId,
    toolName: tools.name,
    toolSlug: tools.slug,
    xPosition: quadrantPositions.xPosition,
    yPosition: quadrantPositions.yPosition,
  })
    .from(quadrantPositions)
    .innerJoin(tools, eq(quadrantPositions.toolId, tools.id))
    .where(eq(quadrantPositions.quadrantId, quadrant.id));

  return {
    ...quadrant,
    quadrantLabels: quadrant.quadrantLabels as { topRight: string; topLeft: string; bottomRight: string; bottomLeft: string },
    positions: positions.map((p) => ({
      ...p,
      xPosition: parseFloat(p.xPosition),
      yPosition: parseFloat(p.yPosition),
    })),
  };
}

export async function getPublishedBlogPosts() {
  return db.select().from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.publishedAt));
}

export async function getBlogPostBySlug(slug: string) {
  const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")));
  return post || null;
}

export async function getRecentBlogPosts(limit: number = 3) {
  return db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    excerpt: blogPosts.excerpt,
    category: blogPosts.category,
    tags: blogPosts.tags,
    publishedAt: blogPosts.publishedAt,
  }).from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.publishedAt)).limit(limit);
}

export async function getSiteStats() {
  const [toolCount] = await db.select({ count: count() }).from(tools).where(eq(tools.status, "published"));
  const [benchmarkCount] = await db.select({ count: count() }).from(benchmarks).where(eq(benchmarks.status, "published"));
  const [quadrantCount] = await db.select({ count: count() }).from(quadrants).where(eq(quadrants.status, "published"));
  const [lastUpdated] = await db.select({ updatedAt: tools.updatedAt }).from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.updatedAt))
    .limit(1);

  return {
    toolCount: toolCount.count,
    benchmarkCount: benchmarkCount.count,
    quadrantCount: quadrantCount.count,
    lastUpdated: lastUpdated?.updatedAt || null,
  };
}

export async function getAllDimensions() {
  return db.select().from(dimensions).orderBy(asc(dimensions.displayOrder));
}

export async function getScoreHistory(toolId: string) {
  return db.select({
    id: scoreHistory.id,
    toolId: scoreHistory.toolId,
    dimensionId: scoreHistory.dimensionId,
    dimensionName: dimensions.name,
    oldScore: scoreHistory.oldScore,
    newScore: scoreHistory.newScore,
    changeReason: scoreHistory.changeReason,
    changedBy: scoreHistory.changedBy,
    changedAt: scoreHistory.changedAt,
  })
    .from(scoreHistory)
    .innerJoin(dimensions, eq(scoreHistory.dimensionId, dimensions.id))
    .where(eq(scoreHistory.toolId, toolId))
    .orderBy(desc(scoreHistory.changedAt));
}

export async function getOverallScoreTrend(toolId: string) {
  return db.select()
    .from(overallScoreHistory)
    .where(eq(overallScoreHistory.toolId, toolId))
    .orderBy(asc(overallScoreHistory.changedAt));
}

export async function getRecentScoreChanges(limit: number = 10) {
  return db.select({
    id: overallScoreHistory.id,
    toolId: overallScoreHistory.toolId,
    toolName: tools.name,
    toolSlug: tools.slug,
    oldScore: overallScoreHistory.oldScore,
    newScore: overallScoreHistory.newScore,
    changedAt: overallScoreHistory.changedAt,
  })
    .from(overallScoreHistory)
    .innerJoin(tools, eq(overallScoreHistory.toolId, tools.id))
    .orderBy(desc(overallScoreHistory.changedAt))
    .limit(limit);
}

export const BEST_FOR_CATEGORIES = [
  { slug: "code-generation", label: "Code Generation", description: "Tools that excel at generating code from prompts, completing functions, and scaffolding projects." },
  { slug: "debugging", label: "Debugging", description: "Tools with superior debugging capabilities — error detection, fix suggestions, and root cause analysis." },
  { slug: "refactoring", label: "Refactoring", description: "Tools that help restructure and improve existing code while maintaining functionality." },
  { slug: "learning", label: "Learning & Onboarding", description: "Tools ideal for developers learning new languages, frameworks, or codebases." },
  { slug: "enterprise", label: "Enterprise Teams", description: "Tools built for large teams with security, compliance, and collaboration features." },
  { slug: "open-source", label: "Open Source Projects", description: "Free and open-source tools with active community support." },
  { slug: "full-stack", label: "Full-Stack Development", description: "Tools that handle both frontend and backend code effectively." },
  { slug: "data-science", label: "Data Science & ML", description: "Tools optimized for data analysis, machine learning, and scientific computing workflows." },
] as const;

export async function getToolsByBestFor(category: string) {
  const allTools = await db.select({
    id: tools.id,
    name: tools.name,
    slug: tools.slug,
    description: tools.description,
    category: tools.category,
    vendor: tools.vendor,
    overallScore: tools.overallScore,
    bestFor: tools.bestFor,
    pricingModel: tools.pricingModel,
    tags: tools.tags,
  })
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.overallScore));

  return allTools.filter((t) => {
    const bf = (t.bestFor || []) as string[];
    return bf.includes(category);
  });
}

export async function getBestForCategoriesWithCounts() {
  const allTools = await db.select({
    bestFor: tools.bestFor,
  })
    .from(tools)
    .where(eq(tools.status, "published"));

  const counts = new Map<string, number>();
  for (const t of allTools) {
    const bf = (t.bestFor || []) as string[];
    for (const cat of bf) {
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
  }

  return BEST_FOR_CATEGORIES.map((cat) => ({
    ...cat,
    count: counts.get(cat.slug) || 0,
  }));
}

export async function getToolsForStackBuilder() {
  const toolList = await db.select({
    id: tools.id,
    name: tools.name,
    slug: tools.slug,
    category: tools.category,
    vendor: tools.vendor,
    overallScore: tools.overallScore,
    bestFor: tools.bestFor,
  })
    .from(tools)
    .where(eq(tools.status, "published"))
    .orderBy(desc(tools.overallScore));

  const allScores = await db.select({
    toolId: toolScores.toolId,
    dimensionId: toolScores.dimensionId,
    dimensionName: dimensions.name,
    dimensionSlug: dimensions.slug,
    score: toolScores.score,
  })
    .from(toolScores)
    .innerJoin(dimensions, eq(toolScores.dimensionId, dimensions.id));

  const scoreMap = new Map<string, Array<{ dimension: string; dimensionSlug: string; score: number }>>();
  for (const s of allScores) {
    const key = s.toolId;
    if (!scoreMap.has(key)) scoreMap.set(key, []);
    scoreMap.get(key)!.push({ dimension: s.dimensionName, dimensionSlug: s.dimensionSlug, score: parseFloat(s.score) });
  }

  return toolList.map((t) => ({
    ...t,
    overallScore: t.overallScore ? parseFloat(t.overallScore) : null,
    scores: scoreMap.get(t.id) || [],
  }));
}

// ============================================
// AI/LLM Ecosystem Directory Queries
// ============================================

export async function getPublishedRepos(opts: {
  page: number;
  pageSize: number;
  sort: string;
  search: string;
  category: string;
}) {
  const conditions = [eq(repos.status, "published")];
  if (opts.search) conditions.push(ilike(repos.name, `%${opts.search}%`));
  if (opts.category) {
    const [cat] = await db.select({ id: repoCategories.id }).from(repoCategories).where(eq(repoCategories.slug, opts.category));
    if (cat) conditions.push(eq(repos.categoryId, cat.id));
  }

  const where = and(...conditions);
  const [totalResult] = await db.select({ count: count() }).from(repos).where(where);
  const total = totalResult.count;

  const sortDesc = opts.sort.startsWith("-");
  const sortField = opts.sort.replace(/^-/, "");
  const sortColumn = sortField === "stars" ? repos.githubStars
    : sortField === "overallScore" ? repos.overallScore
    : sortField === "name" ? repos.name
    : sortField === "updated" ? repos.updatedAt
    : repos.githubStars;

  const repoList = await db.select().from(repos).where(where)
    .orderBy(sortDesc ? desc(sortColumn) : asc(sortColumn))
    .limit(opts.pageSize)
    .offset((opts.page - 1) * opts.pageSize);

  const categories = await db.select().from(repoCategories).orderBy(asc(repoCategories.displayOrder));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return {
    repos: repoList.map((r) => ({
      ...r,
      category: catMap.get(r.categoryId) || null,
    })),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  };
}

export async function getRepoBySlug(slug: string) {
  const [repo] = await db.select().from(repos).where(eq(repos.slug, slug));
  if (!repo) return null;

  const [category] = await db.select().from(repoCategories).where(eq(repoCategories.id, repo.categoryId));

  const allDims = await db.select().from(repoDimensions).orderBy(asc(repoDimensions.displayOrder));
  const scores = await db.select().from(repoScores).where(eq(repoScores.repoId, repo.id));

  const scoreMap = new Map(scores.map((s) => [s.dimensionId, s]));

  const enrichedScores = allDims.map((dim) => {
    const s = scoreMap.get(dim.id);
    return {
      dimension: dim.name,
      dimensionSlug: dim.slug,
      dimensionDescription: dim.description,
      dimensionWeight: parseFloat(dim.weight),
      score: s ? parseFloat(s.score) : null,
      evidence: s?.evidence || null,
    };
  });

  return { ...repo, category, scores: enrichedScores };
}

export async function getRepoCategories() {
  const categories = await db.select().from(repoCategories).orderBy(asc(repoCategories.displayOrder));

  const repoCounts = await db.select({
    categoryId: repos.categoryId,
    count: count(),
  }).from(repos).where(eq(repos.status, "published")).groupBy(repos.categoryId);

  const countMap = new Map(repoCounts.map((r) => [r.categoryId, r.count]));

  return categories.map((c) => ({
    ...c,
    repoCount: countMap.get(c.id) || 0,
  }));
}

export async function getFeaturedRepos(limit: number = 3) {
  const repoList = await db.select().from(repos)
    .where(eq(repos.status, "published"))
    .orderBy(desc(repos.overallScore))
    .limit(limit);

  const categories = await db.select().from(repoCategories);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return repoList.map((r) => ({
    ...r,
    category: catMap.get(r.categoryId) || null,
  }));
}

export async function getAllRepoDimensions() {
  return db.select().from(repoDimensions).orderBy(asc(repoDimensions.displayOrder));
}

// ============================================
// Vibe Coding Showcase Queries
// ============================================

export async function getPublishedShowcaseProjects(opts: {
  page: number;
  pageSize: number;
  toolSlug?: string;
}) {
  const conditions = [eq(showcaseProjects.status, "published")];
  const where = and(...conditions);

  let projectList;
  let total: number;

  if (opts.toolSlug) {
    // Filter by tool via join table
    const [tool] = await db.select({ id: tools.id }).from(tools).where(eq(tools.slug, opts.toolSlug));
    if (!tool) return { projects: [], total: 0, page: opts.page, pageSize: opts.pageSize };

    const linkedIds = await db.select({ projectId: showcaseToolLinks.projectId })
      .from(showcaseToolLinks).where(eq(showcaseToolLinks.toolId, tool.id));
    const idSet = linkedIds.map((l) => l.projectId);
    if (idSet.length === 0) return { projects: [], total: 0, page: opts.page, pageSize: opts.pageSize };

    projectList = await db.select().from(showcaseProjects)
      .where(and(eq(showcaseProjects.status, "published"), sql`${showcaseProjects.id} IN ${idSet}`))
      .orderBy(desc(showcaseProjects.publishedAt))
      .limit(opts.pageSize)
      .offset((opts.page - 1) * opts.pageSize);
    total = idSet.length;
  } else {
    const [totalResult] = await db.select({ count: count() }).from(showcaseProjects).where(where);
    total = totalResult.count;
    projectList = await db.select().from(showcaseProjects).where(where)
      .orderBy(desc(showcaseProjects.publishedAt))
      .limit(opts.pageSize)
      .offset((opts.page - 1) * opts.pageSize);
  }

  // Enrich with tool links
  const projectIds = projectList.map((p) => p.id);
  const allLinks = projectIds.length > 0
    ? await db.select({
        projectId: showcaseToolLinks.projectId,
        toolId: showcaseToolLinks.toolId,
        toolName: tools.name,
        toolSlug: tools.slug,
      }).from(showcaseToolLinks)
        .innerJoin(tools, eq(showcaseToolLinks.toolId, tools.id))
        .where(sql`${showcaseToolLinks.projectId} IN ${projectIds}`)
    : [];

  const linkMap = new Map<string, Array<{ toolId: string; toolName: string; toolSlug: string }>>();
  for (const l of allLinks) {
    if (!linkMap.has(l.projectId)) linkMap.set(l.projectId, []);
    linkMap.get(l.projectId)!.push({ toolId: l.toolId, toolName: l.toolName, toolSlug: l.toolSlug });
  }

  return {
    projects: projectList.map((p) => ({
      ...p,
      linkedTools: linkMap.get(p.id) || [],
    })),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  };
}

export async function getShowcaseBySlug(slug: string) {
  const [project] = await db.select().from(showcaseProjects).where(eq(showcaseProjects.slug, slug));
  if (!project) return null;

  const linkedTools = await db.select({
    toolId: showcaseToolLinks.toolId,
    toolName: tools.name,
    toolSlug: tools.slug,
    toolScore: tools.overallScore,
  }).from(showcaseToolLinks)
    .innerJoin(tools, eq(showcaseToolLinks.toolId, tools.id))
    .where(eq(showcaseToolLinks.projectId, project.id));

  return { ...project, linkedTools };
}

export async function getRecentShowcaseProjects(limit: number = 3) {
  const projectList = await db.select().from(showcaseProjects)
    .where(eq(showcaseProjects.status, "published"))
    .orderBy(desc(showcaseProjects.publishedAt))
    .limit(limit);

  return projectList;
}

export async function getShowcaseByTool(toolSlug: string) {
  const [tool] = await db.select().from(tools).where(eq(tools.slug, toolSlug));
  if (!tool) return { tool: null, projects: [] };

  const linkedIds = await db.select({ projectId: showcaseToolLinks.projectId })
    .from(showcaseToolLinks).where(eq(showcaseToolLinks.toolId, tool.id));

  if (linkedIds.length === 0) return { tool, projects: [] };

  const idSet = linkedIds.map((l) => l.projectId);
  const projects = await db.select().from(showcaseProjects)
    .where(and(eq(showcaseProjects.status, "published"), sql`${showcaseProjects.id} IN ${idSet}`))
    .orderBy(desc(showcaseProjects.publishedAt));

  return { tool, projects };
}
