import { getQuadrantBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { QuadrantDetailClient } from "./quadrant-detail-client";

export const dynamic = "force-dynamic";

export default async function QuadrantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quadrant = await getQuadrantBySlug(slug);

  if (!quadrant) {
    notFound();
  }

  return <QuadrantDetailClient quadrant={quadrant} />;
}
