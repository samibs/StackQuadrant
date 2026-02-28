import type { Metadata } from "next";
import { getPublishedTools, getPublishedQuadrants, getPublishedBenchmarks, getPublishedStacks, getRecentBlogPosts, getRecentlyUpdatedTools, getQuadrantWithPositions } from "@/lib/db/queries";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "StackQuadrant — AI Developer Tool Intelligence",
  description: "Compare AI coding tools with data-driven scores across 6 dimensions. Rankings, quadrant charts, benchmarks, and stack evaluations.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let tools, quadrants, benchmarkList, stackList, recentPosts, recentlyUpdated, featuredQuadrant;

  try {
    [tools, quadrants, benchmarkList, stackList, recentPosts, recentlyUpdated, featuredQuadrant] = await Promise.all([
      getPublishedTools({ page: 1, pageSize: 10, sort: "-overallScore", search: "", category: "" }),
      getPublishedQuadrants(),
      getPublishedBenchmarks(),
      getPublishedStacks(),
      getRecentBlogPosts(3),
      getRecentlyUpdatedTools(3),
      getQuadrantWithPositions(),
    ]);
  } catch {
    return <DashboardClient tools={[]} quadrants={[]} benchmarks={[]} stacks={[]} blogPosts={[]} recentlyUpdated={[]} featuredQuadrant={null} />;
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
    />
  );
}
