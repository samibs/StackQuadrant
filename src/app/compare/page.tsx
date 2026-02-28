import type { Metadata } from "next";
import { getToolsBySlugs, getAllPublishedToolSlugs } from "@/lib/db/queries";
import { CompareClient } from "./compare-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare AI Coding Tools",
  description: "Side-by-side comparison of AI coding tools across 6 dimensions, pricing, features, and community signals.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ tools?: string }>;
}) {
  const params = await searchParams;
  const slugs = params.tools?.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4) || [];
  const allTools = await getAllPublishedToolSlugs();

  let comparedTools: Awaited<ReturnType<typeof getToolsBySlugs>> = [];
  if (slugs.length >= 2) {
    comparedTools = await getToolsBySlugs(slugs);
  }

  return <CompareClient tools={comparedTools} allTools={allTools} initialSlugs={slugs} />;
}
