import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { tools, quadrants, benchmarks, stacks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publishedTools, publishedQuadrants, publishedBenchmarks, publishedStacks] = await Promise.all([
    db.select({ slug: tools.slug, updatedAt: tools.updatedAt }).from(tools).where(eq(tools.status, "published")),
    db.select({ slug: quadrants.slug, updatedAt: quadrants.updatedAt }).from(quadrants).where(eq(quadrants.status, "published")),
    db.select({ slug: benchmarks.slug, updatedAt: benchmarks.updatedAt }).from(benchmarks).where(eq(benchmarks.status, "published")),
    db.select({ slug: stacks.slug, updatedAt: stacks.updatedAt }).from(stacks).where(eq(stacks.status, "published")),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/matrix`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/quadrants`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/benchmarks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/stacks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const toolPages: MetadataRoute.Sitemap = publishedTools.map((t) => ({
    url: `${BASE_URL}/tools/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const quadrantPages: MetadataRoute.Sitemap = publishedQuadrants.map((q) => ({
    url: `${BASE_URL}/quadrants/${q.slug}`,
    lastModified: q.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const benchmarkPages: MetadataRoute.Sitemap = publishedBenchmarks.map((b) => ({
    url: `${BASE_URL}/benchmarks/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const stackPages: MetadataRoute.Sitemap = publishedStacks.map((s) => ({
    url: `${BASE_URL}/stacks/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages, ...quadrantPages, ...benchmarkPages, ...stackPages];
}
