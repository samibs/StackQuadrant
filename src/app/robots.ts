import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

// Retrieval/user-agent crawlers are useful for answer grounding and citation.
const RETRIEVAL_CRAWLERS = [
  "ChatGPT-User",
  "OAI-SearchBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "DuckAssistBot",
  "Mistral-User",
  "YouBot",
] as const;

// Training/general-ingestion crawlers are intentionally restricted unless StackQuadrant
// explicitly changes its content-licensing policy later.
const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Cohere-AI",
] as const;

export default function robots(): MetadataRoute.Robots {
  const retrievalRules = RETRIEVAL_CRAWLERS.map((userAgent) => ({
    userAgent,
    allow: "/",
    disallow: ["/admin/", "/api/"],
  }));
  const trainingRules = TRAINING_CRAWLERS.map((userAgent) => ({
    userAgent,
    disallow: "/",
  }));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      ...retrievalRules,
      ...trainingRules,
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
