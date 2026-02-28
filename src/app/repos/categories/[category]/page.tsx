import type { Metadata } from "next";
import { getPublishedRepos, getRepoCategories } from "@/lib/db/queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreRing } from "@/components/visualizations/score-ring";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

function formatStars(n: number | null): string {
  if (!n) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const categories = await getRepoCategories();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: `${cat.name} — AI/LLM Repositories`,
    description: `${cat.description || `Browse ${cat.name} repositories`}. ${cat.repoCount} repos evaluated.`,
    alternates: { canonical: `/repos/categories/${category}` },
  };
}

export default async function RepoCategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ page?: string; sort?: string }> }) {
  const { category } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const sort = sp.sort || "-stars";

  const categories = await getRepoCategories();
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();

  const data = await getPublishedRepos({ page, pageSize: 24, sort, category, search: "" });
  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Repos", href: "/repos" }, { name: cat.name, href: `/repos/categories/${category}` }]} />
      <div style={{ padding: "var(--grid-gap)" }}>
        <div style={{ padding: "0 0 var(--space-2)" }}>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Repos", href: "/repos" }, { label: cat.name }]} />
        </div>

        <div
          className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] mb-[var(--grid-gap)]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}
        >
          <div>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              {cat.name}
            </h1>
            {cat.description && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {cat.description}
              </p>
            )}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
            {data.total} repos
          </span>
        </div>

        {/* Sort controls */}
        <div className="flex gap-[var(--space-1)] mb-[var(--grid-gap)]">
          {[
            { label: "Stars", value: "-stars" },
            { label: "Score", value: "-overallScore" },
            { label: "Name", value: "name" },
          ].map((s) => (
            <Link
              key={s.value}
              href={`/repos/categories/${category}?sort=${s.value}`}
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

        {data.repos.length === 0 ? (
          <div className="flex items-center justify-center py-[64px]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>No repositories in this category yet.</p>
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
                href={`/repos/categories/${category}?page=${page - 1}${sort !== "-stars" ? `&sort=${sort}` : ""}`}
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
                href={`/repos/categories/${category}?page=${page + 1}${sort !== "-stars" ? `&sort=${sort}` : ""}`}
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
