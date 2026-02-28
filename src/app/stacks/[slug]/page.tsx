import type { Metadata } from "next";
import { getStackBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/components/layout/panel";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { ScoreBar } from "@/components/visualizations/score-bar";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stack = await getStackBySlug(slug);
  if (!stack) return {};
  return {
    title: stack.name,
    description: `${stack.name} stack evaluation: ${stack.useCase}. Overall effectiveness score: ${stack.overallScore}/10.`,
    alternates: { canonical: `/stacks/${slug}` },
    openGraph: {
      title: `${stack.name} — Stack Rating`,
      description: `${stack.useCase}. Score: ${stack.overallScore}/10.`,
    },
  };
}

export default async function StackDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stack = await getStackBySlug(slug);

  if (!stack) {
    notFound();
  }

  return (
    <>
    <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Stacks", href: "/stacks" }, { name: stack.name, href: `/stacks/${slug}` }]} />
    <div style={{ padding: "var(--grid-gap)" }}>
      {/* Header */}
      <div
        className="flex items-start justify-between px-[var(--space-4)] py-[var(--space-3)] mb-[var(--grid-gap)]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
      >
        <div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            {stack.name}
          </h1>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            Use case: {stack.useCase}
          </span>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)", maxWidth: "600px" }}>
            {stack.description}
          </p>
        </div>
        <div className="relative" style={{ width: "72px", height: "72px" }}>
          <ScoreRing score={stack.overallScore} size={72} strokeWidth={5} label="/10" tooltip="Stack effectiveness score (0-10). Measures how well these tools work together for this workflow." />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--grid-gap)" }}>
        {/* Tools in stack */}
        <Panel title="Stack Composition">
          <div className="flex flex-col gap-[var(--space-2)]">
            {stack.tools.map((t) => (
              <Link
                key={t.toolId}
                href={`/tools/${t.toolSlug}`}
                className="flex items-center justify-between no-underline p-[var(--space-2)]"
                style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
              >
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {t.toolName}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                  {t.role}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        {/* Metrics */}
        <Panel title="Stack Metrics">
          <div className="flex flex-col gap-[var(--space-2)]">
            {Object.entries(stack.metrics).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
              const isPercentage = key.toLowerCase().includes("coverage") || key.toLowerCase().includes("score");
              return (
                <ScoreBar
                  key={key}
                  score={isPercentage ? value / 10 : value}
                  maxScore={10}
                  label={label}
                  tooltip={`Metric scored 0-10. ${isPercentage ? "Derived from percentage (value / 10)." : "Based on expert evaluation of this stack combination."}`}
                />
              );
            })}
          </div>
        </Panel>

        {/* Project Outcome */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Panel title="Project Outcome">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.6" }}>
              {stack.projectOutcome}
            </p>
          </Panel>
        </div>
      </div>
    </div>
    </>
  );
}
