import { getPublishedTools, getToolBySlug, getPublishedQuadrants, getQuadrantBySlug, getQuadrantWithPositions, getPublishedBenchmarks, getBenchmarkBySlug, getPublishedStacks, getStackBySlug, getToolsBySlugs, getSearchIndex, getPublishedRepos, getRepoBySlug, getScoreHistory, getOverallScoreTrend, getAllDimensions, getRecentScoreChanges, getToolsForStackBuilder, getBestForCategoriesWithCounts } from "@/lib/db/queries";

// Tool definitions for the MCP server
// Each tool wraps an existing database query function

interface McpToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

const mcpTools: McpToolDefinition[] = [
  {
    name: "query_tools",
    description: "Search and list published AI developer tools with scores. Supports pagination, sorting by score, and text search.",
    parameters: {
      search: { type: "string", description: "Search by name or description" },
      category: { type: "string", description: "Filter by category" },
      sort: { type: "string", description: "Sort field (e.g. '-overallScore')", },
      page: { type: "number", description: "Page number (default 1)" },
      pageSize: { type: "number", description: "Items per page (default 10, max 20)" },
    },
    handler: async (params) => {
      const result = await getPublishedTools({
        page: Number(params.page) || 1,
        pageSize: Math.min(Number(params.pageSize) || 10, 20),
        sort: (params.sort as string) || "-overallScore",
        search: (params.search as string) || "",
        category: (params.category as string) || "",
      });
      return result;
    },
  },
  {
    name: "get_tool_detail",
    description: "Get full details for a specific tool by slug, including dimension scores, benchmark appearances, and stack memberships.",
    parameters: {
      slug: { type: "string", description: "Tool slug (e.g. 'cursor', 'copilot')", required: true },
    },
    handler: async (params) => {
      return await getToolBySlug(params.slug as string);
    },
  },
  {
    name: "compare_tools",
    description: "Compare 2-4 tools side by side with all their dimension scores.",
    parameters: {
      slugs: { type: "string", description: "Comma-separated tool slugs (e.g. 'cursor,copilot,cody')", required: true },
    },
    handler: async (params) => {
      const slugs = (params.slugs as string).split(",").map(s => s.trim()).slice(0, 4);
      return await getToolsBySlugs(slugs);
    },
  },
  {
    name: "query_quadrants",
    description: "Get the latest published quadrant chart with all tool positions. Shows where tools are placed in the Leaders/Visionaries/Challengers/Niche grid.",
    parameters: {},
    handler: async () => {
      return await getQuadrantWithPositions();
    },
  },
  {
    name: "get_quadrant_detail",
    description: "Get a specific quadrant by slug with full tool positions.",
    parameters: {
      slug: { type: "string", description: "Quadrant slug", required: true },
    },
    handler: async (params) => {
      return await getQuadrantBySlug(params.slug as string);
    },
  },
  {
    name: "query_benchmarks",
    description: "List all published benchmarks with their results summary.",
    parameters: {},
    handler: async () => {
      return await getPublishedBenchmarks();
    },
  },
  {
    name: "get_benchmark_detail",
    description: "Get a specific benchmark by slug with all tool results.",
    parameters: {
      slug: { type: "string", description: "Benchmark slug", required: true },
    },
    handler: async (params) => {
      return await getBenchmarkBySlug(params.slug as string);
    },
  },
  {
    name: "query_stacks",
    description: "List all published stack evaluations — tool combinations rated for specific use cases.",
    parameters: {},
    handler: async () => {
      return await getPublishedStacks();
    },
  },
  {
    name: "recommend_stack",
    description: "Get tools suitable for stack building, with scores across all dimensions. Use this to recommend tool combinations.",
    parameters: {},
    handler: async () => {
      const tools = await getToolsForStackBuilder();
      const categories = await getBestForCategoriesWithCounts();
      return { tools, categories };
    },
  },
  {
    name: "search",
    description: "Search across all content types: tools, quadrants, benchmarks, stacks, repos, and showcase projects.",
    parameters: {
      query: { type: "string", description: "Search query", required: true },
    },
    handler: async () => {
      return await getSearchIndex();
    },
  },
  {
    name: "query_repos",
    description: "List published AI/LLM ecosystem repositories with GitHub metrics and quality scores.",
    parameters: {
      category: { type: "string", description: "Filter by category slug" },
      search: { type: "string", description: "Search by name or description" },
      page: { type: "number", description: "Page number" },
      pageSize: { type: "number", description: "Items per page (max 20)" },
    },
    handler: async (params) => {
      return await getPublishedRepos({
        page: Number(params.page) || 1,
        pageSize: Math.min(Number(params.pageSize) || 10, 20),
        sort: "-overallScore",
        search: (params.search as string) || "",
        category: (params.category as string) || "",
      });
    },
  },
  {
    name: "get_score_history",
    description: "Get the score change history for a specific tool — shows how scores changed over time with reasons.",
    parameters: {
      toolSlug: { type: "string", description: "Tool slug", required: true },
    },
    handler: async (params) => {
      const tool = await getToolBySlug(params.toolSlug as string);
      if (!tool) return { error: "Tool not found" };
      const history = await getScoreHistory(tool.id);
      const trend = await getOverallScoreTrend(tool.id);
      return { tool: { name: tool.name, slug: tool.slug, overallScore: tool.overallScore }, history, trend };
    },
  },
];

// MCP Resources (static data)
const mcpResources = {
  dimensions: {
    name: "dimensions",
    description: "All evaluation dimensions with descriptions and weights",
    handler: async () => await getAllDimensions(),
  },
  recent_changes: {
    name: "recent_changes",
    description: "Recent score changes across all tools",
    handler: async () => await getRecentScoreChanges(10),
  },
};

// System prompt for the tool analyst
export const TOOL_ANALYST_PROMPT = `You are the StackQuadrant AI Analyst — a data-driven expert on AI developer tools.

You have access to tools that query the StackQuadrant database containing real evaluations of AI coding tools.

RULES:
1. ONLY make claims backed by data from your tool calls. Never invent scores, tool names, or positions.
2. Always cite which data source you used (dimension scores, quadrant position, benchmark results, etc.)
3. Structure your responses as:
   - Recommendation: tool name + quadrant position
   - Rationale: 3-6 bullet points with specific scores/data
   - Alternatives: 2-4 other tools with brief reasons
   - Confidence: high (6/6 dimensions scored, recent data), medium (partial data), low (sparse data)
4. If asked about a tool that doesn't exist in the database, say so clearly.
5. When comparing tools, always reference specific dimension scores.
6. Keep responses concise and structured — no marketing language.

Available data dimensions for tools:
- Code Generation (how well it generates code)
- Context Understanding (codebase awareness)
- Developer Experience (UX, speed, integration)
- Multi-file Editing (cross-file changes)
- Debugging & Fixing (bug detection and repair)
- Ecosystem Integration (plugins, IDE support, APIs)

Each tool has an overall score (0-10) and is positioned on a quadrant chart:
- Leaders: high capability + high completeness
- Visionaries: high capability + lower completeness
- Challengers: lower capability + high completeness
- Niche Players: specialized but limited`;

// Execute a tool by name
export async function executeMcpTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
  const tool = mcpTools.find(t => t.name === toolName);
  if (!tool) throw new Error(`Unknown MCP tool: ${toolName}`);
  return await tool.handler(params);
}

// Get all tool definitions (for LLM function calling)
export function getMcpToolDefinitions() {
  return mcpTools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: "object" as const,
      properties: Object.fromEntries(
        Object.entries(t.parameters).map(([key, val]) => [key, { type: val.type, description: val.description, ...(val.enum ? { enum: val.enum } : {}) }])
      ),
      required: Object.entries(t.parameters).filter(([, v]) => v.required).map(([k]) => k),
    },
  }));
}

// Execute a resource by name
export async function getMcpResource(resourceName: string): Promise<unknown> {
  const resource = mcpResources[resourceName as keyof typeof mcpResources];
  if (!resource) throw new Error(`Unknown MCP resource: ${resourceName}`);
  return await resource.handler();
}

export { mcpTools, mcpResources };
