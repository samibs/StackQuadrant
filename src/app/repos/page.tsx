import type { Metadata } from "next";
import { getPublishedRepos, getRepoCategories } from "@/lib/db/queries";
import Link from "next/link";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI/LLM Ecosystem Directory — Repository Ratings",
  description: "Data-driven evaluations of AI and LLM open-source repositories: frameworks, agents, RAG libraries, vector databases, and more. Scored across Documentation, Community Health, Maintenance, API Design, Production Readiness, and Ecosystem Integration.",
  alternates: { canonical: "/repos" },
};

function formatStars(n: number | null): string {
  if (!n) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default async function ReposPage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; category?: string; search?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const sort = sp.sort || "-stars";
  const category = sp.category || "";
  const search = sp.search || "";

  const [data, categories] = await Promise.all([
    getPublishedRepos({ page, pageSize: 24, sort, category, search }),
    getRepoCategories(),
  ]);

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Repos", href: "/repos" }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Repos" }]} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            AI/LLM Ecosystem Directory
          </h1>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {data.total} repositories
          </span>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap gap-[var(--space-2)] mb-[var(--grid-gap)] px-[var(--space-3)] py-[var(--space-2)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          {/* Category filter */}
          <div className="flex flex-wrap gap-[var(--space-1)]">
            <Link
              href="/repos"
              className="no-underline"
              style={{
                padding: "2px 8px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                borderRadius: "var(--radius-xs)",
                background: !category ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: !category ? "var(--bg-base)" : "var(--text-muted)",
                border: "1px solid var(--border-default)",
              }}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/repos?category=${cat.slug}${sort !== "-stars" ? `&sort=${sort}` : ""}${search ? `&search=${search}` : ""}`}
                className="no-underline"
                style={{
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  borderRadius: "var(--radius-xs)",
                  background: category === cat.slug ? "var(--accent-primary)" : "var(--bg-elevated)",
                  color: category === cat.slug ? "var(--bg-base)" : "var(--text-muted)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {cat.name} ({cat.repoCount})
              </Link>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-[var(--space-1)] ml-auto">
            {[
              { label: "Stars", value: "-stars" },
              { label: "Score", value: "-overallScore" },
              { label: "Name", value: "name" },
              { label: "Updated", value: "-updated" },
            ].map((s) => (
              <Link
                key={s.value}
                href={`/repos?sort=${s.value}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                className="no-underline"
                style={{
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  borderRadius: "var(--radius-xs)",
                  background: sort === s.value ? "var(--accent-primary)" : "var(--bg-elevated)",
                  color: sort === s.value ? "var(--bg-base)" : "var(--text-muted)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        {data.repos.length === 0 ? (
          <div className="flex items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>No repositories found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "var(--grid-gap)" }}>
            {data.repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/repos/${repo.slug}`}
                className="no-underline"
                style={{ display: "block", padding: "var(--space-4)", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
              >
                <div className="flex items-start justify-between">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.name}
                    </h2>
                    {repo.category && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent-primary)" }}>
                        {repo.category.name}
                      </span>
                    )}
                  </div>
                  {repo.overallScore && (
                    <div style={{ width: "42px", height: "42px", flexShrink: 0 }}>
                      <ScoreRing score={parseFloat(repo.overallScore)} size={42} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "var(--space-2)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {repo.description}
                </p>

                {/* Stats strip */}
                <div className="flex gap-[var(--space-3)] mt-[var(--space-3)]">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    ★ {formatStars(repo.githubStars)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    ◇ {formatStars(repo.githubForks)}
                  </span>
                  {repo.language && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {repo.language}
                    </span>
                  )}
                  {repo.license && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      {repo.license}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-[var(--space-2)] mt-[var(--grid-gap)]">
            {page > 1 && (
              <Link
                href={`/repos?page=${page - 1}${sort !== "-stars" ? `&sort=${sort}` : ""}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}
              >
                ← prev
              </Link>
            )}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/repos?page=${page + 1}${sort !== "-stars" ? `&sort=${sort}` : ""}${category ? `&category=${category}` : ""}${search ? `&search=${search}` : ""}`}
                style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-primary)" }}
              >
                next →
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
