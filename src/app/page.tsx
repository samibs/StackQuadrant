import type { Metadata } from "next";
import { getPublishedTools, getPublishedQuadrants, getPublishedBenchmarks, getPublishedStacks, getRecentBlogPosts, getRecentlyUpdatedTools, getQuadrantWithPositions, getSiteStats, getAllDimensions, getRecentScoreChanges, getFeaturedRepos, getRecentShowcaseProjects } from "@/lib/db/queries";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "StackQuadrant — The Independent Benchmark for AI Developer Tools",
  description: "Data-driven evaluations of AI coding tools across 6 dimensions. Rankings, quadrant charts, benchmarks, and stack evaluations. No sponsorships. No pay-to-rank.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let tools, quadrants, benchmarkList, stackList, recentPosts, recentlyUpdated, featuredQuadrant, siteStats, dimensionList, recentScoreChanges, featuredRepos, recentShowcase;

  try {
    [tools, quadrants, benchmarkList, stackList, recentPosts, recentlyUpdated, featuredQuadrant, siteStats, dimensionList, recentScoreChanges, featuredRepos, recentShowcase] = await Promise.all([
      getPublishedTools({ page: 1, pageSize: 10, sort: "-overallScore", search: "", category: "" }),
      getPublishedQuadrants(),
      getPublishedBenchmarks(),
      getPublishedStacks(),
      getRecentBlogPosts(3),
      getRecentlyUpdatedTools(3),
      getQuadrantWithPositions(),
      getSiteStats(),
      getAllDimensions(),
      getRecentScoreChanges(5),
      getFeaturedRepos(3),
      getRecentShowcaseProjects(3),
    ]);
  } catch {
    return <DashboardClient tools={[]} quadrants={[]} benchmarks={[]} stacks={[]} blogPosts={[]} recentlyUpdated={[]} featuredQuadrant={null} siteStats={null} dimensions={[]} recentScoreChanges={[]} featuredRepos={[]} recentShowcase={[]} />;
  }

  return (
    <DashboardClient
      tools={tools.tools}
      quadrants={quadrants}
      benchmarks={benchmarkList}
      stacks={stackList}
      blogPosts={recentPosts}
      recentlyUpdated={recentlyUpdated}
      featuredQuadrant={featuredQuadrant}
      siteStats={siteStats}
      dimensions={dimensionList}
      recentScoreChanges={recentScoreChanges}
      featuredRepos={featuredRepos}
      recentShowcase={recentShowcase}
    />
  );
}
