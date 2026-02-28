import type { Metadata } from "next";
import Link from "next/link";
import { getToolsByBestFor, BEST_FOR_CATEGORIES } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ScoreRing } from "@/components/visualizations/score-ring";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = BEST_FOR_CATEGORIES.find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: `Best AI Tools for ${cat.label} — StackQuadrant`,
    description: cat.description,
    alternates: { canonical: `/best-for/${category}` },
    openGraph: {
      title: `Best AI Tools for ${cat.label}`,
      description: cat.description,
    },
  };
}

export default async function BestForCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = BEST_FOR_CATEGORIES.find((c) => c.slug === category);

  if (!cat) {
    notFound();
  }

  const categoryTools = await getToolsByBestFor(category);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Best For", href: "/best-for" }, { name: cat.label, href: `/best-for/${category}` }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Best For", href: "/best-for" }, { label: cat.label }]} />

        <div style={{ marginTop: "var(--grid-gap)" }}>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Best AI Tools for {cat.label}
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginTop: "var(--space-2)", maxWidth: "600px" }}>
            {cat.description}
          </p>
        </div>

        {categoryTools.length === 0 ? (
          <div style={{
            marginTop: "var(--space-4)",
            padding: "var(--space-4)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            textAlign: "center",
          }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>
              No tools have been categorized for {cat.label} yet.
            </p>
            <Link href="/matrix" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-primary)", marginTop: "var(--space-2)", display: "inline-block" }}>
              Browse all tools &rarr;
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--grid-gap)", marginTop: "var(--space-4)" }}>
            {categoryTools.map((tool, i) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="no-underline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) var(--space-4)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  borderLeft: i === 0 ? "3px solid var(--score-high)" : "1px solid var(--border-default)",
                  transition: "border-color 150ms",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: i === 0 ? "var(--score-high)" : "var(--text-muted)",
                  width: "28px",
                  textAlign: "center",
                }}>
                  #{i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {tool.name}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}>
                      {tool.category}
                    </span>
                    {tool.pricingModel && (
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        background: tool.pricingModel === "free" ? "rgba(22,163,74,0.1)" : "rgba(59,130,246,0.1)",
                        color: tool.pricingModel === "free" ? "var(--score-high)" : "#3b82f6",
                      }}>
                        {tool.pricingModel}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
                    {tool.description.length > 120 ? tool.description.substring(0, 120) + "..." : tool.description}
                  </p>
                  {tool.vendor && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {tool.vendor}
                    </span>
                  )}
                </div>
                <div style={{ width: "52px", height: "52px", flexShrink: 0 }}>
                  <ScoreRing
                    score={tool.overallScore ? parseFloat(String(tool.overallScore)) : 0}
                    size={52}
                    strokeWidth={4}
                    label="/10"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Other categories */}
        <div style={{ marginTop: "var(--space-4)" }}>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>
            Other Categories
          </h2>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {BEST_FOR_CATEGORIES.filter((c) => c.slug !== category).map((c) => (
              <Link
                key={c.slug}
                href={`/best-for/${c.slug}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "4px 10px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
