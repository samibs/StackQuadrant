import type { Metadata } from "next";
import { getQuadrantBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { QuadrantDetailClient } from "./quadrant-detail-client";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
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
      <div style={{ padding: "var(--grid-gap) var(--grid-gap) 0" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Quadrants", href: "/quadrants" }, { label: quadrant.title }]} />
      </div>
      <QuadrantDetailClient quadrant={quadrant} />
    </>
  );
}
