import type { Metadata } from "next";
import { getPublishedTools } from "@/lib/db/queries";
import { getPublishedQuadrants } from "@/lib/db/queries";
import { getPublishedBenchmarks } from "@/lib/db/queries";
import { getPublishedStacks } from "@/lib/db/queries";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — AI Developer Tool Intelligence",
  description: "Compare AI coding tools with data-driven scores across 6 dimensions. Rankings, quadrant charts, benchmarks, and stack evaluations.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let tools, quadrants, benchmarkList, stackList;

  try {
    [tools, quadrants, benchmarkList, stackList] = await Promise.all([
      getPublishedTools({ page: 1, pageSize: 10, sort: "-overallScore", search: "", category: "" }),
      getPublishedQuadrants(),
      getPublishedBenchmarks(),
      getPublishedStacks(),
    ]);
  } catch {
    return <DashboardClient tools={[]} quadrants={[]} benchmarks={[]} stacks={[]} />;
  }

  return (
    <DashboardClient
      tools={tools.tools}
      quadrants={quadrants}
      benchmarks={benchmarkList}
      stacks={stackList}
    />
  );
}
