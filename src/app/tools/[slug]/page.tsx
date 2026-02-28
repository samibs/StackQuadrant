import { getToolBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { ToolDetailClient } from "./tool-detail-client";

export const dynamic = "force-dynamic";

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolDetailClient tool={tool} />;
}
