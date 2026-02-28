import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { tools, quadrants, benchmarks, stacks, repos, repoCategories, showcaseProjects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { BEST_FOR_CATEGORIES } from "@/lib/db/queries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publishedTools, publishedQuadrants, publishedBenchmarks, publishedStacks, publishedRepos, repoCats, publishedShowcase] = await Promise.all([
    db.select({ slug: tools.slug, updatedAt: tools.updatedAt }).from(tools).where(eq(tools.status, "published")),
    db.select({ slug: quadrants.slug, updatedAt: quadrants.updatedAt }).from(quadrants).where(eq(quadrants.status, "published")),
    db.select({ slug: benchmarks.slug, updatedAt: benchmarks.updatedAt }).from(benchmarks).where(eq(benchmarks.status, "published")),
    db.select({ slug: stacks.slug, updatedAt: stacks.updatedAt }).from(stacks).where(eq(stacks.status, "published")),
    db.select({ slug: repos.slug, updatedAt: repos.updatedAt }).from(repos).where(eq(repos.status, "published")),
    db.select({ slug: repoCategories.slug }).from(repoCategories).orderBy(asc(repoCategories.displayOrder)),
    db.select({ slug: showcaseProjects.slug, publishedAt: showcaseProjects.publishedAt }).from(showcaseProjects).where(eq(showcaseProjects.status, "published")),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/matrix`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/quadrants`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/benchmarks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/stacks`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/best-for`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/stack-builder`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/repos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/showcase`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/showcase/submit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
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

  const bestForPages: MetadataRoute.Sitemap = BEST_FOR_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/best-for/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const repoPages: MetadataRoute.Sitemap = publishedRepos.map((r) => ({
    url: `${BASE_URL}/repos/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const repoCategoryPages: MetadataRoute.Sitemap = repoCats.map((c) => ({
    url: `${BASE_URL}/repos/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const showcasePages: MetadataRoute.Sitemap = publishedShowcase.map((p) => ({
    url: `${BASE_URL}/showcase/${p.slug}`,
    lastModified: p.publishedAt || new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...toolPages, ...quadrantPages, ...benchmarkPages, ...stackPages, ...bestForPages, ...repoPages, ...repoCategoryPages, ...showcasePages];
}
