// ============================================
// Idea Service — AI-powered solution idea generation per pain point
// ============================================

import OpenAI from "openai";
import { db } from "@/lib/db";
import { solutionIdeas, painPoints, scans } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { getUserPlan } from "@/lib/services/billing-service";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is required");
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}
const MODEL = "gpt-4o-mini";

interface GeneratedIdea {
  title: string;
  description: string;
  confidenceScore: number;
  targetAudience: string;
}

/**
 * Generate AI solution ideas for a pain point, enforcing plan limits.
 */
export async function generateIdeas(painPointId: string, userId: string): Promise<
  { success: true; ideas: typeof solutionIdeas.$inferSelect[] } |
  { success: false; code: string; message: string }
> {
  // Get pain point + verify ownership
  const [pp] = await db.select().from(painPoints).where(eq(painPoints.id, painPointId));
  if (!pp) return { success: false, code: "NOT_FOUND", message: "Pain point not found" };

  const [scan] = await db.select({ userId: scans.userId }).from(scans).where(eq(scans.id, pp.scanId));
  if (!scan || scan.userId !== userId) return { success: false, code: "NOT_FOUND", message: "Pain point not found" };

  // Check plan limits
  const plan = await getUserPlan(userId);
  if (plan.limits.ideasPerPainPoint === 0) {
    return { success: false, code: "PLAN_LIMIT_REACHED", message: "Solution ideas are not available on the Free plan. Upgrade to Starter or Pro." };
  }

  // Check existing ideas count
  const [existing] = await db.select({ count: count() }).from(solutionIdeas).where(eq(solutionIdeas.painPointId, painPointId));
  if (existing.count >= plan.limits.ideasPerPainPoint) {
    return { success: false, code: "PLAN_LIMIT_REACHED", message: `You've reached the maximum of ${plan.limits.ideasPerPainPoint} ideas for this pain point on your ${plan.name} plan.` };
  }

  const numToGenerate = plan.limits.ideasPerPainPoint - existing.count;

  // Generate ideas via OpenAI
  const generated = await callOpenAI(pp, numToGenerate);

  if (generated.length === 0) {
    return { success: false, code: "GENERATION_FAILED", message: "Failed to generate ideas. Please try again." };
  }

  // Store ideas
  const inserted = await db.insert(solutionIdeas).values(
    generated.map(idea => ({
      painPointId,
      title: idea.title.slice(0, 240),
      description: idea.description,
      confidenceScore: Math.max(0, Math.min(100, Math.round(idea.confidenceScore))),
      targetAudience: idea.targetAudience,
    }))
  ).returning();

  return { success: true, ideas: inserted };
}

async function callOpenAI(pp: typeof painPoints.$inferSelect, numIdeas: number): Promise<GeneratedIdea[]> {
  const prompt = `You are a product strategist. Given this pain point discovered from market research, generate ${numIdeas} actionable solution ideas.

Pain Point: "${pp.title}"
Summary: ${pp.summary}
Severity: ${pp.severityScore}/100
Frequency: ${pp.frequencyScore}/100
Market Size Score: ${pp.marketSizeScore}/100
Competition Score: ${pp.competitionScore}/100 (higher = less competition = more opportunity)
Willingness to Pay: ${pp.wtpScore}/100
Trend: ${pp.trendDirection}
${pp.audienceSummary ? `Target Audience: ${pp.audienceSummary}` : ""}
${pp.competitorNames?.length ? `Existing Competitors: ${(pp.competitorNames as string[]).join(", ")}` : ""}

For each idea:
1. title: Concise product/feature name (max 240 chars)
2. description: 2-3 sentence explanation of the solution approach
3. confidenceScore: 0-100, how confident you are this is viable
4. targetAudience: Who would use/buy this

Respond with valid JSON only. No markdown fences.
Return: { "ideas": [{ "title": "...", "description": "...", "confidenceScore": N, "targetAudience": "..." }] }`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { ideas: GeneratedIdea[] };
    return Array.isArray(parsed.ideas) ? parsed.ideas : [];
  } catch (error) {
    console.error("[idea-service] OpenAI generation failed:", error);
    return [];
  }
}
