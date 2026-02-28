import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { ToolDetailClient } from "./tool-detail-client";
import { SoftwareApplicationJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  const score = tool.overallScore ? ` — ${tool.overallScore}/10` : "";
  return {
    title: `${tool.name} Review${score}`,
    description: `${tool.name} evaluation: scored across Code Generation, Context Understanding, Developer Experience, Multi-file Editing, Debugging, and Ecosystem Integration.${tool.vendor ? ` By ${tool.vendor}.` : ""}`,
    alternates: { canonical: `/tools/${slug}` },
    openGraph: {
      title: `${tool.name} — AI Tool Review${score}`,
      description: `Data-driven evaluation of ${tool.name} across 6 dimensions.`,
    },
  };
}

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Matrix", href: "/matrix" }, { name: tool.name, href: `/tools/${slug}` }]} />
      <div style={{ padding: "var(--grid-gap) var(--grid-gap) 0" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Matrix", href: "/matrix" }, { label: tool.name }]} />
      </div>
      <SoftwareApplicationJsonLd
        name={tool.name}
        description={tool.description}
        url={`/tools/${slug}`}
        category={tool.category}
        score={tool.overallScore}
        vendor={tool.vendor}
      />
      <ToolDetailClient tool={tool} />
    </>
  );
}
