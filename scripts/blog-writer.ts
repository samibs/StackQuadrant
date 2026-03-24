/**
 * Blog Writer — Automated AI/LLM News Blogger
 * Fetches trending AI/developer-tools news from HackerNews and Reddit,
 * uses Claude to generate a blog post, and publishes it to the database.
 *
 * Designed to be run via PM2 cron (every 2 days).
 * Usage: npx tsx scripts/blog-writer.ts
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { desc, eq } from "drizzle-orm";
import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";

// Inline schema (standalone script — no Next.js imports)
const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── News Source Fetchers ────────────────────────────────────────────────────

const AI_KEYWORDS = [
  "AI", "LLM", "GPT", "Claude", "Copilot", "coding assistant", "developer tools",
  "machine learning", "RAG", "vector database", "fine-tuning", "inference",
  "agent", "transformer", "open source AI", "Anthropic", "OpenAI", "Gemini",
  "Cursor", "Windsurf", "Cline", "code generation", "prompt engineering",
];

interface NewsItem {
  title: string;
  url: string;
  source: string;
  score: number;
  comments: number;
  summary: string;
}

async function fetchHackerNews(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  try {
    // Fetch top stories
    const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!topRes.ok) return items;
    const topIds: number[] = await topRes.json();

    // Check top 60 stories for AI relevance
    const batch = topIds.slice(0, 60);
    const stories = await Promise.all(
      batch.map(async (id) => {
        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return res.ok ? res.json() : null;
      })
    );

    for (const story of stories) {
      if (!story || !story.title) continue;
      const titleLower = story.title.toLowerCase();
      const isAI = AI_KEYWORDS.some((kw) => titleLower.includes(kw.toLowerCase()));
      if (!isAI) continue;

      items.push({
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        source: "Hacker News",
        score: story.score || 0,
        comments: story.descendants || 0,
        summary: story.title,
      });
    }

    console.log(`[blog-writer] HackerNews: found ${items.length} AI-related stories`);
  } catch (err) {
    console.warn("[blog-writer] HackerNews fetch failed:", err instanceof Error ? err.message : err);
  }

  return items;
}

async function fetchRedditAI(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  const subreddits = ["MachineLearning", "artificial", "LocalLLaMA", "ChatGPT", "programming"];

  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=week&limit=10`, {
        headers: { "User-Agent": "StackQuadrant-BlogWriter/1.0" },
      });
      if (!res.ok) continue;

      const data = await res.json();
      const children = data?.data?.children || [];

      for (const child of children) {
        const post = child.data;
        const titleLower = (post.title || "").toLowerCase();
        const isAI = AI_KEYWORDS.some((kw) => titleLower.includes(kw.toLowerCase()));

        // For AI-specific subreddits, include all; otherwise filter
        const aiSubs = ["MachineLearning", "artificial", "LocalLLaMA", "ChatGPT"];
        if (!aiSubs.includes(sub) && !isAI) continue;

        items.push({
          title: post.title,
          url: post.url?.startsWith("http") ? post.url : `https://reddit.com${post.permalink}`,
          source: `Reddit r/${sub}`,
          score: post.score || 0,
          comments: post.num_comments || 0,
          summary: (post.selftext || post.title).slice(0, 300),
        });
      }

      await new Promise((r) => setTimeout(r, 1000)); // rate limit
    } catch (err) {
      console.warn(`[blog-writer] Reddit r/${sub} failed:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[blog-writer] Reddit: found ${items.length} AI-related stories`);
  return items;
}

// ─── Blog Generation ─────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

const CATEGORIES = [
  "AI Tools & Frameworks",
  "LLM Development",
  "Developer Productivity",
  "Open Source AI",
  "Industry Analysis",
  "Market Trends",
] as const;

interface GeneratedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
}

async function generateBlogPost(
  anthropic: Anthropic,
  newsItems: NewsItem[],
  recentTitles: string[],
): Promise<GeneratedPost | null> {
  // Sort by score + comments and take the top stories
  const topNews = newsItems
    .sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2))
    .slice(0, 15);

  if (topNews.length === 0) {
    console.warn("[blog-writer] No news items to write about");
    return null;
  }

  const newsDigest = topNews.map((n, i) =>
    `${i + 1}. "${n.title}" (${n.source}, score: ${n.score}, comments: ${n.comments})\n   URL: ${n.url}\n   ${n.summary}`
  ).join("\n\n");

  const recentContext = recentTitles.length > 0
    ? `\n\nRecent blog posts already published (DO NOT repeat these topics):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const today = new Date().toISOString().split("T")[0];
  const categories = CATEGORIES.join(", ");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `You are the blog writer for StackQuadrant, a platform that evaluates and compares AI coding tools, LLM frameworks, and developer productivity tools. Your audience is developers and engineering leaders evaluating AI tools for their stack.

Today's date: ${today}

Here are the trending AI/developer-tools stories from the past few days:

${newsDigest}
${recentContext}

Write a blog post that synthesizes the most interesting themes from these stories into a cohesive, insightful article. The post should:

1. Pick a compelling angle that connects 2-4 of these stories
2. Provide genuine analysis and developer-relevant insight, not just a news summary
3. Reference specific tools, frameworks, or developments by name
4. Include practical implications for developers choosing AI tools
5. Be opinionated — take a position on where things are headed

Return your response as JSON with this exact structure:
{
  "title": "Post title (max 150 chars, compelling and specific)",
  "excerpt": "2-3 sentence summary for the blog listing page (max 300 chars)",
  "content": "Full post in clean HTML. Use <h2>, <h3>, <p>, <ul>/<li>, <strong>, <em>, <code>, and <blockquote> tags. No <h1>. No inline styles. No script tags. Around 800-1200 words.",
  "category": "One of: ${categories}",
  "tags": ["array", "of", "relevant", "tool-names-and-topics", "lowercase", "max 6 tags"]
}

Return ONLY the JSON object, no markdown code fences or extra text.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    // Parse JSON — strip code fences if Claude wraps them anyway
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as {
      title: string;
      excerpt: string;
      content: string;
      category: string;
      tags: string[];
    };

    if (!parsed.title || !parsed.content || !parsed.excerpt) {
      console.error("[blog-writer] Generated post missing required fields");
      return null;
    }

    const dateSlug = today.replace(/-/g, "");
    const slug = `${dateSlug}-${slugify(parsed.title)}`;

    return {
      title: parsed.title.slice(0, 300),
      slug: slug.slice(0, 300),
      excerpt: parsed.excerpt.slice(0, 2000),
      content: parsed.content,
      category: CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])
        ? parsed.category
        : "Industry Analysis",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map((t) => String(t).toLowerCase()) : [],
    };
  } catch (err) {
    console.error("[blog-writer] Failed to parse AI response:", err instanceof Error ? err.message : err);
    console.error("[blog-writer] Raw response:", text.slice(0, 500));
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log(`[blog-writer] Starting at ${new Date().toISOString()}`);

  if (!process.env.DATABASE_URL) {
    console.error("[blog-writer] DATABASE_URL not set");
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[blog-writer] ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client);

  try {
    // 1. Fetch recent posts to avoid duplicates
    const recentPosts = await db
      .select({ title: blogPosts.title })
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(10);
    const recentTitles = recentPosts.map((p) => p.title);
    console.log(`[blog-writer] Found ${recentTitles.length} recent posts to avoid duplicating`);

    // 2. Fetch news from multiple sources in parallel
    const [hnNews, redditNews] = await Promise.all([
      fetchHackerNews(),
      fetchRedditAI(),
    ]);

    const allNews = [...hnNews, ...redditNews];
    console.log(`[blog-writer] Total news items: ${allNews.length}`);

    if (allNews.length < 3) {
      console.warn("[blog-writer] Not enough news items to generate a meaningful post, skipping");
      return;
    }

    // 3. Generate blog post with Claude
    console.log("[blog-writer] Generating blog post with Claude...");
    const post = await generateBlogPost(anthropic, allNews, recentTitles);

    if (!post) {
      console.error("[blog-writer] Failed to generate blog post");
      return;
    }

    // 4. Check for slug collision
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, post.slug));

    if (existing) {
      console.warn(`[blog-writer] Slug "${post.slug}" already exists, appending suffix`);
      post.slug = `${post.slug}-${Date.now().toString(36)}`;
    }

    // 5. Insert as published
    const now = new Date();
    const [inserted] = await db.insert(blogPosts).values({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags,
      status: "published",
      publishedAt: now,
      updatedAt: now,
    }).returning({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[blog-writer] Published: "${inserted.title}"`);
    console.log(`[blog-writer]   Slug: ${inserted.slug}`);
    console.log(`[blog-writer]   Category: ${post.category}`);
    console.log(`[blog-writer]   Tags: ${post.tags.join(", ")}`);
    console.log(`[blog-writer] Done in ${elapsed}s`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[blog-writer] Fatal error:", err);
  process.exit(1);
});
