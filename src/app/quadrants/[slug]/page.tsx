import type { Metadata } from "next";
import { getQuadrantBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { QuadrantDetailClient } from "./quadrant-detail-client";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const quadrant = await getQuadrantBySlug(slug);
  if (!quadrant) return {};
  return {
    title: quadrant.title,
    description: quadrant.description.substring(0, 160),
    alternates: { canonical: `/quadrants/${slug}` },
    openGraph: {
      title: `${quadrant.title} — StackQuadrant`,
      description: quadrant.description.substring(0, 160),
    },
  };
}

export default async function QuadrantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quadrant = await getQuadrantBySlug(slug);

  if (!quadrant) {
    notFound();
  }

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Quadrants", href: "/quadrants" }, { name: quadrant.title, href: `/quadrants/${slug}` }]} />
      <CollectionPageJsonLd
        name={`${quadrant.title} — AI Coding Tool Quadrant`}
        description={quadrant.description}
        url={`/quadrants/${slug}`}
        itemKind="SoftwareApplication"
        items={quadrant.positions.map((p) => ({
          name: p.toolName,
          url: `/tools/${p.toolSlug}`,
          score: p.overallScore,
          description: `${p.toolName} positioned in ${quadrant.title}: capability ${p.xPosition.toFixed(2)}, market presence ${p.yPosition.toFixed(2)}.`,
        }))}
      />
      <div style={{ padding: "var(--grid-gap) var(--grid-gap) 0" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Quadrants", href: "/quadrants" }, { label: quadrant.title }]} />
      </div>
      <QuadrantDetailClient quadrant={quadrant} />
    </>
  );
}
