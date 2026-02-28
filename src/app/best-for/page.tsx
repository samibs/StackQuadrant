import type { Metadata } from "next";
import Link from "next/link";
import { getBestForCategoriesWithCounts } from "@/lib/db/queries";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best AI Tools By Use Case — StackQuadrant",
  description: "Find the best AI developer tools for your specific use case: code generation, debugging, refactoring, enterprise teams, and more.",
  alternates: { canonical: "/best-for" },
};

export default async function BestForIndexPage() {
  const categories = await getBestForCategoriesWithCounts();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Best For", href: "/best-for" }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Best For" }]} />

        <div style={{ marginTop: "var(--grid-gap)" }}>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Best AI Tools By Use Case
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)", marginTop: "var(--space-2)", maxWidth: "600px" }}>
            Not all AI coding tools are created equal. Find the ones that excel at what you need most.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
            gap: "var(--grid-gap)",
            marginTop: "var(--space-4)",
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/best-for/${cat.slug}`}
              className="no-underline"
              style={{
                display: "block",
                padding: "var(--space-4)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                transition: "border-color 150ms",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {cat.label}
                </h2>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  background: cat.count > 0 ? "rgba(22,163,74,0.1)" : "var(--bg-elevated)",
                  color: cat.count > 0 ? "var(--score-high)" : "var(--text-muted)",
                }}>
                  {cat.count} {cat.count === 1 ? "tool" : "tools"}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: 1.5 }}>
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
