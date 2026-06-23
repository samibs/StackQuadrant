import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

// Crawlers explicitly allowed to ingest content for LLM citation.
// Listed individually so future policy tightening can flip a single entry to disallow.
const LLM_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "GoogleOther",
  "CCBot",
  "Bytespider",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "Mistral-User",
  "YouBot",
  "Cohere-AI",
] as const;

export default function robots(): MetadataRoute.Robots {
  const llmRules = LLM_CRAWLERS.map((userAgent) => ({
    userAgent,
    allow: "/",
    disallow: ["/admin/", "/api/"],
  }));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      ...llmRules,
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
